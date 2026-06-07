import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma/prisma.service";
import { CreateBookingDto } from "./dto/create-booking.dto";
import { QueryBookingDto } from "./dto/query-booking.dto";
import { BookingStatus } from "@prisma/client";

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) { }

  async create(dto: CreateBookingDto, userId: number) {
    const { roomId, checkInDate, checkOutDate, serviceIds, comboIds, voucherCode } = dto;

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const numberOfNights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    if (numberOfNights < 1) throw new BadRequestException("Check-out must be after check-in");

    await this.releaseExpiredBookings();

    return this.prisma.$transaction(async (tx) => {
      const conflict = await tx.booking.findFirst({
        where: {
          roomId,
          status: { in: ["PENDING", "CONFIRMED", "CHECKED_IN"] },
          checkInDate: { lt: checkOut },
          checkOutDate: { gt: checkIn },
        },
      });
      if (conflict) throw new BadRequestException("Room is not available for selected dates");

      const room = await tx.room.findUnique({ where: { id: roomId } });
      if (!room || room.status !== "AVAILABLE") throw new BadRequestException("Room not available");
      const roomPricePerNight = room.pricePerNight;

      let serviceTotal = 0;
      if (serviceIds?.length) {
        const services = await tx.service.findMany({ where: { id: { in: serviceIds }, isActive: true } });
        serviceTotal = Number(services.reduce((sum, s) => sum + Number(s.price), 0));
      }

      let comboTotal = 0;
      if (comboIds?.length) {
        const combos = await tx.serviceCombo.findMany({ where: { id: { in: comboIds }, isActive: true } });
        comboTotal = Number(combos.reduce((sum, c) => sum + Number(c.comboPrice), 0));
      }

      let discountAmount = 0;
      let voucherId: number | null = null;
      if (voucherCode) {
        const voucher = await tx.voucher.findUnique({ where: { code: voucherCode } });
        if (!voucher || !voucher.isActive || voucher.usedCount >= voucher.maxUsage) {
          throw new BadRequestException("Invalid voucher");
        }
        const now = new Date();
        if (now < voucher.startDate || now > voucher.endDate) {
          throw new BadRequestException("Voucher expired");
        }
        const subtotal = numberOfNights * Number(roomPricePerNight) + serviceTotal + comboTotal;
        discountAmount = voucher.discountType === "PERCENTAGE"
          ? Math.round(Number(subtotal) * Number(voucher.discountValue) / 100)
          : Number(voucher.discountValue);
        voucherId = voucher.id;
        await tx.voucher.update({ where: { id: voucher.id }, data: { usedCount: { increment: 1 } } });
      }

      const totalAmount = numberOfNights * Number(roomPricePerNight) + serviceTotal + comboTotal - discountAmount;
      const bookingCode = `BK${Date.now()}`;
      const expiresAt = new Date(Date.now() + 2 * 60 * 1000);

      const booking = await tx.booking.create({
        data: {
          bookingCode,
          userId,
          roomId,
          voucherId,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          numberOfNights,
          roomPricePerNight,
          serviceTotal,
          comboTotal,
          discountAmount,
          totalAmount,
          expiresAt,
        },
      });

      if (serviceIds?.length) {
        const services = await tx.service.findMany({ where: { id: { in: serviceIds } } });
        await tx.bookingService.createMany({
          data: services.map((s) => ({
            bookingId: booking.id,
            serviceId: s.id,
            quantity: 1,
            priceSnapshot: s.price,
          })),
        });
      }

      if (comboIds?.length) {
        const combos = await tx.serviceCombo.findMany({ where: { id: { in: comboIds } } });
        await tx.bookingCombo.createMany({
          data: combos.map((c) => ({
            bookingId: booking.id,
            comboId: c.id,
            quantity: 1,
            comboPriceSnapshot: c.comboPrice,
          })),
        });
      }

      return this.findBookingById(tx, booking.id);
    });
  }

  private findBookingById(tx: any, id: number) {
    return tx.booking.findUnique({
      where: { id },
      include: {
        room: { include: { roomType: true } },
        services: { include: { service: true } },
        combos: { include: { combo: true } },
        voucher: true,
        payment: true,
      },
    });
  }

  private async releaseExpiredBookings() {
    const now = new Date();
    const expired = await this.prisma.booking.findMany({
      where: {
        status: "PENDING",
        expiresAt: { lt: now },
      },
      select: { id: true, voucherId: true },
    });

    for (const booking of expired) {
      await this.prisma.$transaction(async (tx) => {
        if (booking.voucherId) {
          await tx.voucher.update({
            where: { id: booking.voucherId },
            data: { usedCount: { decrement: 1 } },
          });
        }
        await tx.booking.update({
          where: { id: booking.id },
          data: { status: "CANCELLED" },
        });
      });
    }

    if (expired.length > 0) {
      console.log(`Released ${expired.length} expired booking(s)`);
    }
  }

  async findByUser(userId: number) {
    await this.releaseExpiredBookings();
    return this.prisma.booking.findMany({
      where: { userId },
      include: {
        room: { include: { roomType: true } },
        services: { include: { service: true } },
        combos: { include: { combo: true } },
        payment: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  findAll(query: QueryBookingDto) {
    return this.prisma.booking.findMany({
      where: {
        ...(query.status && { status: query.status as BookingStatus }),
        ...(query.userId && { userId: query.userId }),
      },
      include: {
        user: { select: { id: true, email: true, fullName: true } },
        room: { include: { roomType: true } },
        payment: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: number) {
    await this.releaseExpiredBookings();
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, fullName: true, phone: true } },
        room: { include: { roomType: true, images: true } },
        services: { include: { service: true } },
        combos: { include: { combo: true } },
        voucher: true,
        payment: true,
      },
    });
    if (!booking) throw new NotFoundException("Booking not found");
    return booking;
  }

  async cancel(id: number, userId: number, role: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException("Booking not found");
    if (role === "GUEST" && booking.userId !== userId) {
      throw new ForbiddenException("You can only cancel your own bookings");
    }
    if (booking.status === "CANCELLED") throw new BadRequestException("Booking already cancelled");
    if (booking.status === "CHECKED_OUT") throw new BadRequestException("Cannot cancel checked-out booking");
    if (booking.status === "PENDING" && new Date() > booking.expiresAt) {
      throw new BadRequestException("Booking has already expired");
    }

    return this.prisma.$transaction(async (tx) => {
      if (booking.voucherId) {
        await tx.voucher.update({
          where: { id: booking.voucherId },
          data: { usedCount: { decrement: 1 } },
        });
      }

      return tx.booking.update({
        where: { id },
        data: { status: "CANCELLED" },
      });
    });
  }
}
