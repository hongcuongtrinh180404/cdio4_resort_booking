import { Injectable, NotFoundException, BadRequestException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma/prisma.service";
import * as bcrypt from "bcryptjs";
import { generateRevenueExcel } from "./utils/excel-export.util";

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
        where: { status: { in: ["PAID", "SUCCESS"] } },
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

  async getRevenueStats(fromDate?: string, toDate?: string) {
    const where: any = { status: { in: ["PAID", "SUCCESS"] }, paidAt: { not: null } };
    if (fromDate || toDate) {
      where.paidAt = {};
      if (fromDate) where.paidAt.gte = new Date(fromDate + "T00:00:00.000Z");
      if (toDate) where.paidAt.lte = new Date(toDate + "T23:59:59.999Z");
    }

    const payments = await this.prisma.payment.findMany({
      where,
      select: { amount: true, paidAt: true, bookingId: true },
      orderBy: { paidAt: "asc" },
    });

    const dailyMap = new Map<string, { bookingIds: Set<number>; revenue: number }>();
    for (const p of payments) {
      if (!p.paidAt) continue;
      const key = p.paidAt.toISOString().slice(0, 10);
      if (!dailyMap.has(key)) dailyMap.set(key, { bookingIds: new Set(), revenue: 0 });
      const entry = dailyMap.get(key)!;
      entry.bookingIds.add(p.bookingId);
      entry.revenue += Number(p.amount);
    }

    const data = Array.from(dailyMap.entries()).map(([date, { bookingIds, revenue }]) => ({
      date,
      bookingCount: bookingIds.size,
      revenue,
    }));

    return {
      data,
      summary: {
        totalRevenue: data.reduce((s, d) => s + d.revenue, 0),
        totalBookings: data.reduce((s, d) => s + d.bookingCount, 0),
      },
    };
  }

  async exportRevenueStatsExcel(fromDate?: string, toDate?: string): Promise<Buffer> {
    const stats = await this.getRevenueStats(fromDate, toDate);
    
    // Format daily data for display: YYYY-MM-DD to DD/MM/YYYY
    const formattedData = stats.data.map(item => {
      const parts = item.date.split('-');
      const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : item.date;
      return {
        ...item,
        date: formattedDate,
      };
    });

    // Format query dates for subtitle
    const formattedFromDate = fromDate ? fromDate.split('-').reverse().join('/') : undefined;
    const formattedToDate = toDate ? toDate.split('-').reverse().join('/') : undefined;

    const workbook = await generateRevenueExcel(formattedData, formattedFromDate, formattedToDate);
    return workbook.xlsx.writeBuffer() as Promise<Buffer>;
  }

  async getRevenueReport(page = 1, limit = 20, fromDate?: string, toDate?: string) {
    const where: any = { status: { in: ["PAID", "SUCCESS"] } };
    if (fromDate || toDate) {
      where.paidAt = {};
      if (fromDate) where.paidAt.gte = new Date(fromDate + "T00:00:00.000Z");
      if (toDate) where.paidAt.lte = new Date(toDate + "T23:59:59.999Z");
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        include: {
          booking: {
            select: { bookingCode: true, createdAt: true },
          },
        },
        orderBy: { paidAt: "desc" },
      }),
      this.prisma.payment.count({ where }),
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

  async getAllUsers(page = 1, limit = 20, role?: string) {
    const where = role ? { role: role as any } : {};
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          role: true,
          status: true,
          createdAt: true,
          _count: { select: { bookings: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.user.count({ where }),
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

  async createUser(dto: { email: string; password: string; fullName: string; phone?: string; role?: "GUEST" | "EMPLOYEE" | "ADMIN" }) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new BadRequestException("Email already exists");

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        fullName: dto.fullName,
        phone: dto.phone,
        role: dto.role ?? "GUEST",
      },
      select: { id: true, email: true, fullName: true, phone: true, role: true, createdAt: true },
    });
    return user;
  }

  async updateUser(id: number, dto: { fullName?: string; email?: string; phone?: string; role?: "GUEST" | "EMPLOYEE" | "ADMIN"; status?: "ACTIVE" | "LOCKED"; newPassword?: string }) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("User not found");

    if (dto.email && dto.email !== user.email) {
      const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (existing) throw new ConflictException("Email already in use");
    }

    const data: any = {};
    if (dto.fullName !== undefined) data.fullName = dto.fullName;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.role !== undefined) data.role = dto.role;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.newPassword) data.password = await bcrypt.hash(dto.newPassword, 10);

    return this.prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, fullName: true, phone: true, role: true, status: true, createdAt: true },
    });
  }
}
