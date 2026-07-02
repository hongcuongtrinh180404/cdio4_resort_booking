import { Injectable, NotFoundException, BadRequestException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma/prisma.service";
import * as bcrypt from "bcryptjs";
import { generateRevenueExcel, generateTopRoomTypesExcel, generateTopBookedRoomsExcel, generateTopCustomersExcel, generateRevenueBySourceExcel, generateTopServicesExcel } from "./utils/excel-export.util";

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

  // ────────────────────────────────────────────────────────────────
  // Revenue Stats with Trend
  // ────────────────────────────────────────────────────────────────

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

    const totalRevenue = data.reduce((s, d) => s + d.revenue, 0);
    const totalBookings = data.reduce((s, d) => s + d.bookingCount, 0);

    // Calculate trend vs previous period
    let revenueChange: number | null = null;
    let bookingsChange: number | null = null;

    if (fromDate && toDate) {
      const from = new Date(fromDate + "T00:00:00.000Z");
      const to = new Date(toDate + "T23:59:59.999Z");
      const durationMs = to.getTime() - from.getTime();
      const prevTo = new Date(from.getTime() - 1);
      const prevFrom = new Date(prevTo.getTime() - durationMs);

      const prevPayments = await this.prisma.payment.findMany({
        where: {
          status: { in: ["PAID", "SUCCESS"] },
          paidAt: { gte: prevFrom, lte: prevTo },
        },
        select: { amount: true, bookingId: true },
      });

      const prevRevenue = prevPayments.reduce((s, p) => s + Number(p.amount), 0);
      const prevBookingIds = new Set(prevPayments.map((p) => p.bookingId));
      const prevBookings = prevBookingIds.size;

      revenueChange = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : null;
      bookingsChange = prevBookings > 0 ? ((totalBookings - prevBookings) / prevBookings) * 100 : null;
    }

    return {
      data,
      summary: {
        totalRevenue,
        totalBookings,
        revenueChange,
        bookingsChange,
      },
    };
  }

  // ────────────────────────────────────────────────────────────────
  // Export Revenue Stats Excel
  // ────────────────────────────────────────────────────────────────

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

  // ────────────────────────────────────────────────────────────────
  // Top Room Types by Revenue
  // ────────────────────────────────────────────────────────────────

  async getTopRoomTypesByRevenue(fromDate?: string, toDate?: string, topN = 10) {
    const dateFilter = this.buildPaymentDateFilter(fromDate, toDate);

    const bookings = await this.prisma.booking.findMany({
      where: {
        status: { in: ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"] },
        payment: { ...dateFilter },
      },
      select: {
        id: true,
        room: {
          select: {
            roomType: { select: { id: true, name: true } },
          },
        },
        payment: { select: { amount: true } },
      },
    });

    const map = new Map<number, { name: string; revenue: number; bookingCount: number }>();
    for (const b of bookings) {
      const rt = b.room.roomType;
      const amount = b.payment ? Number(b.payment.amount) : 0;
      if (!map.has(rt.id)) map.set(rt.id, { name: rt.name, revenue: 0, bookingCount: 0 });
      const entry = map.get(rt.id)!;
      entry.revenue += amount;
      entry.bookingCount += 1;
    }

    const data = Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, topN);

    return { data };
  }

  async exportTopRoomTypesExcel(fromDate?: string, toDate?: string, topN = 10): Promise<Buffer> {
    const stats = await this.getTopRoomTypesByRevenue(fromDate, toDate, topN);
    const formattedFromDate = fromDate ? fromDate.split('-').reverse().join('/') : undefined;
    const formattedToDate = toDate ? toDate.split('-').reverse().join('/') : undefined;
    const workbook = await generateTopRoomTypesExcel(stats.data, formattedFromDate, formattedToDate);
    return workbook.xlsx.writeBuffer() as Promise<Buffer>;
  }

  // ────────────────────────────────────────────────────────────────
  // Top Booked Rooms
  // ────────────────────────────────────────────────────────────────

  async getTopBookedRooms(fromDate?: string, toDate?: string, topN = 10) {
    const dateFilter = this.buildPaymentDateFilter(fromDate, toDate);

    const bookings = await this.prisma.booking.findMany({
      where: {
        status: { notIn: ["CANCELLED"] },
        payment: { ...dateFilter },
      },
      select: {
        id: true,
        room: {
          select: {
            id: true,
            roomNumber: true,
            name: true,
            roomType: { select: { name: true } },
          },
        },
        payment: { select: { amount: true } },
      },
    });

    const map = new Map<number, { roomNumber: string; name: string; roomTypeName: string; bookingCount: number; revenue: number }>();
    for (const b of bookings) {
      const r = b.room;
      const amount = b.payment ? Number(b.payment.amount) : 0;
      if (!map.has(r.id))
        map.set(r.id, { roomNumber: r.roomNumber, name: r.name, roomTypeName: r.roomType.name, bookingCount: 0, revenue: 0 });
      const entry = map.get(r.id)!;
      entry.bookingCount += 1;
      entry.revenue += amount;
    }

    const data = Array.from(map.values())
      .sort((a, b) => b.bookingCount - a.bookingCount)
      .slice(0, topN);

    return { data };
  }

  async exportTopBookedRoomsExcel(fromDate?: string, toDate?: string, topN = 10): Promise<Buffer> {
    const stats = await this.getTopBookedRooms(fromDate, toDate, topN);
    const formattedFromDate = fromDate ? fromDate.split('-').reverse().join('/') : undefined;
    const formattedToDate = toDate ? toDate.split('-').reverse().join('/') : undefined;
    const workbook = await generateTopBookedRoomsExcel(stats.data, formattedFromDate, formattedToDate);
    return workbook.xlsx.writeBuffer() as Promise<Buffer>;
  }

  // ────────────────────────────────────────────────────────────────
  // Top VIP Customers
  // ────────────────────────────────────────────────────────────────

  async getTopCustomers(fromDate?: string, toDate?: string, topN = 10) {
    const dateFilter = this.buildPaymentDateFilter(fromDate, toDate);

    const bookings = await this.prisma.booking.findMany({
      where: {
        payment: { ...dateFilter },
      },
      select: {
        id: true,
        user: {
          select: { id: true, email: true, fullName: true, phone: true },
        },
        payment: { select: { amount: true } },
      },
    });

    const map = new Map<number, { fullName: string; email: string; phone: string | null; bookingCount: number; totalSpent: number }>();
    for (const b of bookings) {
      const u = b.user;
      const amount = b.payment ? Number(b.payment.amount) : 0;
      if (!map.has(u.id))
        map.set(u.id, { fullName: u.fullName, email: u.email, phone: u.phone, bookingCount: 0, totalSpent: 0 });
      const entry = map.get(u.id)!;
      entry.bookingCount += 1;
      entry.totalSpent += amount;
    }

    const data = Array.from(map.values())
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, topN);

    return { data };
  }

  async exportTopCustomersExcel(fromDate?: string, toDate?: string, topN = 10): Promise<Buffer> {
    const stats = await this.getTopCustomers(fromDate, toDate, topN);
    const formattedFromDate = fromDate ? fromDate.split('-').reverse().join('/') : undefined;
    const formattedToDate = toDate ? toDate.split('-').reverse().join('/') : undefined;
    const workbook = await generateTopCustomersExcel(stats.data, formattedFromDate, formattedToDate);
    return workbook.xlsx.writeBuffer() as Promise<Buffer>;
  }

  // ────────────────────────────────────────────────────────────────
  // Revenue by Source
  // ────────────────────────────────────────────────────────────────

  async getRevenueBySource(fromDate?: string, toDate?: string) {
    const dateFilter = this.buildPaymentDateFilter(fromDate, toDate);

    const bookings = await this.prisma.booking.findMany({
      where: {
        payment: { ...dateFilter },
      },
      select: {
        numberOfNights: true,
        roomPricePerNight: true,
        services: { select: { priceSnapshot: true, quantity: true } },
        combos: { select: { comboPriceSnapshot: true, quantity: true } },
      },
    });

    let roomRevenue = 0;
    let serviceRevenue = 0;
    let comboRevenue = 0;

    for (const b of bookings) {
      roomRevenue += Number(b.roomPricePerNight) * b.numberOfNights;
      for (const s of b.services) {
        serviceRevenue += Number(s.priceSnapshot) * s.quantity;
      }
      for (const c of b.combos) {
        comboRevenue += Number(c.comboPriceSnapshot) * c.quantity;
      }
    }

    const data = [
      { source: "Phòng", revenue: roomRevenue },
      { source: "Dịch vụ lẻ", revenue: serviceRevenue },
      { source: "Combo", revenue: comboRevenue },
    ];

    return { data, total: roomRevenue + serviceRevenue + comboRevenue };
  }

  async exportRevenueBySourceExcel(fromDate?: string, toDate?: string): Promise<Buffer> {
    const stats = await this.getRevenueBySource(fromDate, toDate);
    const formattedFromDate = fromDate ? fromDate.split('-').reverse().join('/') : undefined;
    const formattedToDate = toDate ? toDate.split('-').reverse().join('/') : undefined;
    const workbook = await generateRevenueBySourceExcel(stats.data, stats.total, formattedFromDate, formattedToDate);
    return workbook.xlsx.writeBuffer() as Promise<Buffer>;
  }

  // ────────────────────────────────────────────────────────────────
  // Most Used Services
  // ────────────────────────────────────────────────────────────────

  async getTopServices(fromDate?: string, toDate?: string, topN = 10) {
    const dateFilter = this.buildPaymentDateFilter(fromDate, toDate);

    const bookingServices = await this.prisma.bookingService.findMany({
      where: {
        booking: {
          payment: { ...dateFilter },
        },
      },
      select: {
        quantity: true,
        priceSnapshot: true,
        service: { select: { id: true, name: true } },
      },
    });

    const map = new Map<number, { name: string; totalUsage: number; revenue: number }>();
    for (const bs of bookingServices) {
      const svc = bs.service;
      if (!map.has(svc.id)) map.set(svc.id, { name: svc.name, totalUsage: 0, revenue: 0 });
      const entry = map.get(svc.id)!;
      entry.totalUsage += bs.quantity;
      entry.revenue += Number(bs.priceSnapshot) * bs.quantity;
    }

    const data = Array.from(map.values())
      .sort((a, b) => b.totalUsage - a.totalUsage)
      .slice(0, topN);

    return { data };
  }

  async exportTopServicesExcel(fromDate?: string, toDate?: string, topN = 10): Promise<Buffer> {
    const stats = await this.getTopServices(fromDate, toDate, topN);
    const formattedFromDate = fromDate ? fromDate.split('-').reverse().join('/') : undefined;
    const formattedToDate = toDate ? toDate.split('-').reverse().join('/') : undefined;
    const workbook = await generateTopServicesExcel(stats.data, formattedFromDate, formattedToDate);
    return workbook.xlsx.writeBuffer() as Promise<Buffer>;
  }

  // ────────────────────────────────────────────────────────────────
  // Helper: Build payment date filter
  // ────────────────────────────────────────────────────────────────

  private buildPaymentDateFilter(fromDate?: string, toDate?: string): any {
    const filter: any = { status: { in: ["PAID", "SUCCESS"] } };
    if (fromDate || toDate) {
      filter.paidAt = {};
      if (fromDate) filter.paidAt.gte = new Date(fromDate + "T00:00:00.000Z");
      if (toDate) filter.paidAt.lte = new Date(toDate + "T23:59:59.999Z");
    }
    return filter;
  }

  // ────────────────────────────────────────────────────────────────
  // Existing: Revenue Report (paginated list)
  // ────────────────────────────────────────────────────────────────

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

  // ────────────────────────────────────────────────────────────────
  // Rooms / Users / Bookings management (unchanged)
  // ────────────────────────────────────────────────────────────────

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
