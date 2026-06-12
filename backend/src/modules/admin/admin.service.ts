import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma/prisma.service";

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard() {
    const [
      totalRooms,
      activeBookings,
      totalUsers,
      pendingBookings,
      totalRevenue,
    ] = await Promise.all([
      this.prisma.room.count(),
      this.prisma.booking.count({ where: { status: "CONFIRMED" } }),
      this.prisma.user.count(),
      this.prisma.booking.count({ where: { status: "PENDING" } }),
      this.prisma.payment.aggregate({
        where: { status: "SUCCESS" },
        _sum: { amount: true },
      }),
    ]);

    return {
      totalRooms,
      activeBookings,
      totalUsers,
      pendingBookings,
      totalRevenue: totalRevenue._sum.amount ?? 0,
    };
  }

  async getRevenueReport(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        where: { status: "SUCCESS" },
        skip,
        take: limit,
        include: {
          booking: {
            select: { bookingCode: true, createdAt: true },
          },
        },
        orderBy: { paidAt: "desc" },
      }),
      this.prisma.payment.count({ where: { status: "SUCCESS" } }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getAllRooms(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.room.findMany({
        skip,
        take: limit,
        include: {
          roomType: true,
          images: { orderBy: { sortOrder: "asc" } },
          amenities: { include: { amenity: true } },
        },
        orderBy: { roomNumber: "asc" },
      }),
      this.prisma.room.count(),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getAllUsers(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          role: true,
          createdAt: true,
          _count: { select: { bookings: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.user.count(),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getBookingDetail(id: number) {
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
}
