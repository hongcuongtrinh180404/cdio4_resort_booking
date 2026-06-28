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

  @Get("dashboard")
  @ApiOperation({ summary: "Get admin dashboard stats" })
  dashboard() {
    return this.adminService.getDashboard();
  }

  @Get("reports/revenue-stats")
  @ApiOperation({ summary: "Get aggregated revenue stats by day" })
  revenueStats(@Query() query: RevenueQueryDto) {
    return this.adminService.getRevenueStats(query.fromDate, query.toDate);
  }

  @Get("reports/revenue")
  @ApiOperation({ summary: "Get revenue report" })
  revenue(@Query() query: RevenueQueryDto) {
    return this.adminService.getRevenueReport(query.page, query.limit, query.fromDate, query.toDate);
  }

  @Get("reports/revenue/export")
  @ApiOperation({ summary: "Export revenue report to Excel" })
  async exportRevenue(@Query() query: RevenueQueryDto, @Res() res: Response) {
    const buffer = await this.adminService.exportRevenueStatsExcel(query.fromDate, query.toDate);
    
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=bao_cao_doanh_thu_${query.fromDate || "all"}_to_${query.toDate || "all"}.xlsx`
    );
    
    res.end(buffer);
  }

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
}
