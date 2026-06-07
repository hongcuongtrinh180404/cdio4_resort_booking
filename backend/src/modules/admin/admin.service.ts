import { Injectable } from "@nestjs/common";
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

  async getRevenueReport() {
    return this.prisma.payment.findMany({
      where: { status: "SUCCESS" },
      include: {
        booking: {
          select: { bookingCode: true, createdAt: true },
        },
      },
      orderBy: { paidAt: "desc" },
    });
  }
}
