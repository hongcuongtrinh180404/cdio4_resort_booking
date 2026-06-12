import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { AdminService } from "./admin.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/enums";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from "class-validator";

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

class UpdateRoleDto {
  @IsEnum(["GUEST", "EMPLOYEE", "ADMIN"])
  role: "GUEST" | "EMPLOYEE" | "ADMIN";
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

  @Get("reports/revenue")
  @ApiOperation({ summary: "Get revenue report" })
  revenue(@Query() pagination: PaginationDto) {
    return this.adminService.getRevenueReport(pagination.page, pagination.limit);
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

  @Patch("users/:id/role")
  @ApiOperation({ summary: "Update user role — ADMIN only" })
  @Roles(Role.ADMIN)
  updateUserRole(@Param("id") id: string, @Body() dto: UpdateRoleDto) {
    return this.adminService.updateUserRole(Number(id), dto.role);
  }
}
