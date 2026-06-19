import { Injectable, NotFoundException, BadRequestException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma/prisma.service";
import * as bcrypt from "bcryptjs";

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
