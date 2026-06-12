import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { AdminService } from "./admin.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/enums";
import { PaginationDto } from "../../common/dto/pagination.dto";

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
    return this.adminService.getAllUsers(pagination.page, pagination.limit);
  }

  @Get("bookings/:id")
  @ApiOperation({ summary: "Get booking detail — EMPLOYEE/ADMIN" })
  getBookingDetail(@Param("id") id: string) {
    return this.adminService.getBookingDetail(Number(id));
  }
}
