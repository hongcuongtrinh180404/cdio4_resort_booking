import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, Res } from "@nestjs/common";
import { Response } from "express";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { AdminService } from "./admin.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role, UserStatus } from "../../common/enums";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { RevenueQueryDto } from "./dto/revenue-query.dto";
import { IsEmail, IsString, MinLength, IsOptional, IsEnum, Matches } from "class-validator";

class CreateUserByAdminDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  fullName: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(["GUEST", "EMPLOYEE", "ADMIN"])
  role?: "GUEST" | "EMPLOYEE" | "ADMIN";
}

class UpdateUserDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d+$/, { message: "Số điện thoại chỉ được chứa số (0-9)" })
  phone?: string;

  @IsOptional()
  @IsEnum(["GUEST", "EMPLOYEE", "ADMIN"])
  role?: "GUEST" | "EMPLOYEE" | "ADMIN";

  @IsOptional()
  @IsEnum(["ACTIVE", "LOCKED"])
  status?: "ACTIVE" | "LOCKED";

  @IsOptional()
  @IsString()
  @MinLength(6)
  newPassword?: string;
}

@ApiTags("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.EMPLOYEE, Role.ADMIN)
@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ────────────────────────────────────────────────────────────────
  // Dashboard
  // ────────────────────────────────────────────────────────────────

  @Get("dashboard")
  @ApiOperation({ summary: "Get admin dashboard stats" })
  dashboard() {
    return this.adminService.getDashboard();
  }

  // ────────────────────────────────────────────────────────────────
  // Revenue Stats + Trend
  // ────────────────────────────────────────────────────────────────

  @Get("reports/revenue-stats")
  @ApiOperation({ summary: "Get aggregated revenue stats by day with trend %" })
  revenueStats(@Query() query: RevenueQueryDto) {
    return this.adminService.getRevenueStats(query.fromDate, query.toDate);
  }

  @Get("reports/revenue")
  @ApiOperation({ summary: "Get revenue report (paginated payment list)" })
  revenue(@Query() query: RevenueQueryDto) {
    return this.adminService.getRevenueReport(query.page, query.limit, query.fromDate, query.toDate);
  }

  @Get("reports/revenue/export")
  @ApiOperation({ summary: "Export revenue report to Excel" })
  async exportRevenue(@Query() query: RevenueQueryDto, @Res() res: Response) {
    const buffer = await this.adminService.exportRevenueStatsExcel(query.fromDate, query.toDate);
    this.sendExcelResponse(res, buffer, `bao_cao_doanh_thu_${query.fromDate || "all"}_to_${query.toDate || "all"}.xlsx`);
  }

  // ────────────────────────────────────────────────────────────────
  // Top Room Types by Revenue
  // ────────────────────────────────────────────────────────────────

  @Get("reports/top-room-types")
  @ApiOperation({ summary: "Get top room types by revenue" })
  topRoomTypes(@Query() query: RevenueQueryDto) {
    return this.adminService.getTopRoomTypesByRevenue(query.fromDate, query.toDate, query.topN);
  }

  @Get("reports/top-room-types/export")
  @ApiOperation({ summary: "Export top room types report to Excel" })
  async exportTopRoomTypes(@Query() query: RevenueQueryDto, @Res() res: Response) {
    const buffer = await this.adminService.exportTopRoomTypesExcel(query.fromDate, query.toDate, query.topN);
    this.sendExcelResponse(res, buffer, `top_loai_phong_${query.fromDate || "all"}_to_${query.toDate || "all"}.xlsx`);
  }

  // ────────────────────────────────────────────────────────────────
  // Top Booked Rooms
  // ────────────────────────────────────────────────────────────────

  @Get("reports/top-booked-rooms")
  @ApiOperation({ summary: "Get top booked rooms" })
  topBookedRooms(@Query() query: RevenueQueryDto) {
    return this.adminService.getTopBookedRooms(query.fromDate, query.toDate, query.topN);
  }

  @Get("reports/top-booked-rooms/export")
  @ApiOperation({ summary: "Export top booked rooms report to Excel" })
  async exportTopBookedRooms(@Query() query: RevenueQueryDto, @Res() res: Response) {
    const buffer = await this.adminService.exportTopBookedRoomsExcel(query.fromDate, query.toDate, query.topN);
    this.sendExcelResponse(res, buffer, `top_phong_dat_${query.fromDate || "all"}_to_${query.toDate || "all"}.xlsx`);
  }

  // ────────────────────────────────────────────────────────────────
  // Top VIP Customers
  // ────────────────────────────────────────────────────────────────

  @Get("reports/top-customers")
  @ApiOperation({ summary: "Get top VIP customers by total spent" })
  topCustomers(@Query() query: RevenueQueryDto) {
    return this.adminService.getTopCustomers(query.fromDate, query.toDate, query.topN);
  }

  @Get("reports/top-customers/export")
  @ApiOperation({ summary: "Export top customers report to Excel" })
  async exportTopCustomers(@Query() query: RevenueQueryDto, @Res() res: Response) {
    const buffer = await this.adminService.exportTopCustomersExcel(query.fromDate, query.toDate, query.topN);
    this.sendExcelResponse(res, buffer, `top_khach_hang_${query.fromDate || "all"}_to_${query.toDate || "all"}.xlsx`);
  }

  // ────────────────────────────────────────────────────────────────
  // Revenue by Source
  // ────────────────────────────────────────────────────────────────

  @Get("reports/revenue-by-source")
  @ApiOperation({ summary: "Get revenue breakdown by source (room/service/combo)" })
  revenueBySource(@Query() query: RevenueQueryDto) {
    return this.adminService.getRevenueBySource(query.fromDate, query.toDate);
  }

  @Get("reports/revenue-by-source/export")
  @ApiOperation({ summary: "Export revenue by source report to Excel" })
  async exportRevenueBySource(@Query() query: RevenueQueryDto, @Res() res: Response) {
    const buffer = await this.adminService.exportRevenueBySourceExcel(query.fromDate, query.toDate);
    this.sendExcelResponse(res, buffer, `doanh_thu_theo_nguon_${query.fromDate || "all"}_to_${query.toDate || "all"}.xlsx`);
  }

  // ────────────────────────────────────────────────────────────────
  // Most Used Services
  // ────────────────────────────────────────────────────────────────

  @Get("reports/top-services")
  @ApiOperation({ summary: "Get most used services" })
  topServices(@Query() query: RevenueQueryDto) {
    return this.adminService.getTopServices(query.fromDate, query.toDate, query.topN);
  }

  @Get("reports/top-services/export")
  @ApiOperation({ summary: "Export top services report to Excel" })
  async exportTopServices(@Query() query: RevenueQueryDto, @Res() res: Response) {
    const buffer = await this.adminService.exportTopServicesExcel(query.fromDate, query.toDate, query.topN);
    this.sendExcelResponse(res, buffer, `top_dich_vu_${query.fromDate || "all"}_to_${query.toDate || "all"}.xlsx`);
  }

  // ────────────────────────────────────────────────────────────────
  // Rooms / Users / Bookings management
  // ────────────────────────────────────────────────────────────────

  @Get("rooms")
  @ApiOperation({ summary: "Get all rooms (including non-available) — EMPLOYEE/ADMIN" })
  getAllRooms(@Query() pagination: PaginationDto) {
    return this.adminService.getAllRooms(pagination.page, pagination.limit);
  }

  @Get("users")
  @ApiOperation({ summary: "Get all users — EMPLOYEE/ADMIN" })
  getAllUsers(@Query() pagination: PaginationDto) {
    return this.adminService.getAllUsers(pagination.page, pagination.limit, pagination.role);
  }

  @Get("bookings/:id")
  @ApiOperation({ summary: "Get booking detail — EMPLOYEE/ADMIN" })
  getBookingDetail(@Param("id") id: string) {
    return this.adminService.getBookingDetail(Number(id));
  }

  @Post("users")
  @ApiOperation({ summary: "Create a user with role — ADMIN only" })
  @Roles(Role.ADMIN)
  createUser(@Body() dto: CreateUserByAdminDto) {
    return this.adminService.createUser(dto);
  }

  @Patch("users/:id")
  @ApiOperation({ summary: "Update user info, role, status or password — ADMIN only" })
  @Roles(Role.ADMIN)
  updateUser(@Param("id") id: string, @Body() dto: UpdateUserDto) {
    return this.adminService.updateUser(Number(id), dto);
  }

  // ────────────────────────────────────────────────────────────────
  // Helper
  // ────────────────────────────────────────────────────────────────

  private sendExcelResponse(res: Response, buffer: Buffer, filename: string) {
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    res.end(buffer);
  }
}
