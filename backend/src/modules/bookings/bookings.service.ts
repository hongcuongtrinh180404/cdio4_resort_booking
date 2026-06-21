import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma/prisma.service";
import { CreateBookingDto } from "./dto/create-booking.dto";
import { QueryBookingDto } from "./dto/query-booking.dto";
import { BookingStatus, RoomStatus } from "@prisma/client";

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) { }

  async create(dto: CreateBookingDto, userId: number, expiresInMinutes = 2) {
    const { roomId, checkInDate, checkOutDate, services, combos, paymentMethod } = dto;

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

      let serviceTotal = 0;
      let serviceDetails: any[] = [];
      if (services?.length) {
        const serviceIds = services.map((s) => s.serviceId);
        serviceDetails = await tx.service.findMany({ where: { id: { in: serviceIds }, isActive: true } });
        for (const item of services) {
          const svc = serviceDetails.find((s) => s.id === item.serviceId);
          if (!svc) throw new BadRequestException(`Service id ${item.serviceId} not found`);
          serviceTotal += Number(svc.price) * item.quantity;
        }
      }

      let comboTotal = 0;
      let comboDetails: any[] = [];
      if (combos?.length) {
        const comboIds = combos.map((c) => c.comboId);
        comboDetails = await tx.serviceCombo.findMany({ where: { id: { in: comboIds }, isActive: true } });
        for (const item of combos) {
          const cmb = comboDetails.find((c) => c.id === item.comboId);
          if (!cmb) throw new BadRequestException(`Combo id ${item.comboId} not found`);
          comboTotal += Number(cmb.comboPrice) * item.quantity;
        }
      }

      const totalAmount = numberOfNights * Number(room.pricePerNight) + serviceTotal + comboTotal;
      const bookingCode = `BK${Date.now()}`;
      const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

      const booking = await tx.booking.create({
        data: {
          bookingCode,
          userId,
          roomId,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          numberOfNights,
          roomPricePerNight: room.pricePerNight,
          serviceTotal,
          comboTotal,
          totalAmount,
          expiresAt,
          specialRequests: dto.specialRequests,
        },
      });

      if (services?.length) {
        await tx.bookingService.createMany({
          data: services.map((s) => ({
            bookingId: booking.id,
            serviceId: s.serviceId,
            quantity: s.quantity,
            priceSnapshot: serviceDetails.find((d) => d.id === s.serviceId)!.price,
          })),
        });
      }

      if (combos?.length) {
        await tx.bookingCombo.createMany({
          data: combos.map((c) => ({
            bookingId: booking.id,
            comboId: c.comboId,
            quantity: c.quantity,
            comboPriceSnapshot: comboDetails.find((d) => d.id === c.comboId)!.comboPrice,
          })),
        });
      }

      await tx.payment.create({
        data: {
          bookingId: booking.id,
          amount: totalAmount,
          transactionRef: `BOOKING_${booking.id}`,
          status: "PENDING",
        },
      });

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
      select: { id: true },
    });

    for (const booking of expired) {
      await this.prisma.booking.update({
        where: { id: booking.id },
        data: { status: "CANCELLED" },
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

  async findAll(query: QueryBookingDto) {
    const where: any = {};
    if (query.status) where.status = query.status as BookingStatus;
    if (query.userId) where.userId = query.userId;

    if (query.search) {
      where.OR = [
        { bookingCode: { contains: query.search } },
        { user: { fullName: { contains: query.search } } },
      ];
    }

    if (query.phone) {
      where.user = { ...(where.user || {}), phone: { contains: query.phone } };
    }

    if (query.checkInFrom || query.checkInTo) {
      where.checkInDate = {
        ...(query.checkInFrom && { gte: new Date(query.checkInFrom) }),
        ...(query.checkInTo && { lte: new Date(query.checkInTo) }),
      };
    }

    if (query.checkOutFrom || query.checkOutTo) {
      where.checkOutDate = {
        ...(query.checkOutFrom && { gte: new Date(query.checkOutFrom) }),
        ...(query.checkOutTo && { lte: new Date(query.checkOutTo) }),
      };
    }

    if (query.roomTypeId) {
      where.room = { roomTypeId: query.roomTypeId };
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { id: true, email: true, fullName: true, phone: true } },
          room: { include: { roomType: true } },
          payment: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
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
        payment: true,
      },
    });
    if (!booking) throw new NotFoundException("Booking not found");
    return booking;
  }

  async cancel(id: number, userId: number, role: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { payment: true },
    });
    if (!booking) throw new NotFoundException("Booking not found");
    if (role === "GUEST" && booking.userId !== userId) {
      throw new ForbiddenException("You can only cancel your own bookings");
    }
    if (booking.status === "CANCELLED") throw new BadRequestException("Booking already cancelled");
    if (booking.status === "CHECKED_OUT" || booking.status === "CHECKED_IN") {
      throw new BadRequestException("Cannot cancel this booking");
    }

    if (role === "GUEST" && booking.status === "CONFIRMED") {
      const hoursSinceCreation = (Date.now() - new Date(booking.createdAt).getTime()) / (1000 * 60 * 60);
      if (hoursSinceCreation > 24) {
        throw new BadRequestException("Cannot cancel booking after 24 hours from creation");
      }
    }

    const refunded = booking.payment?.status === "PAID" || booking.payment?.status === "SUCCESS";

    if (refunded) {
      await this.prisma.payment.update({
        where: { bookingId: id },
        data: { sepayTransactionId: "CANCELLED_REFUND" },
      });
    }

    await this.prisma.booking.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    return {
      message: "Booking cancelled successfully",
      refunded,
      refundAmount: refunded ? Number(booking.totalAmount) : 0,
    };
  }

  async updateStatus(id: number, status: "CHECKED_IN" | "CHECKED_OUT") {
    const booking = await this.prisma.booking.findUnique({ where: { id }, include: { payment: true } });
    if (!booking) throw new NotFoundException("Booking not found");

    if (status === "CHECKED_IN") {
      if (booking.status !== "CONFIRMED") throw new BadRequestException("Only confirmed bookings can be checked in");
      if (booking.payment?.status !== "PAID" && booking.payment?.status !== "SUCCESS") throw new BadRequestException("Booking must be paid before check-in");
    }

    if (status === "CHECKED_OUT") {
      if (booking.status !== "CHECKED_IN") throw new BadRequestException("Booking must be checked in before check-out");
    }

    return this.prisma.booking.update({
      where: { id },
      data: { status },
      include: {
        user: { select: { id: true, email: true, fullName: true } },
        room: true,
        payment: true,
      },
    });
  }
}
