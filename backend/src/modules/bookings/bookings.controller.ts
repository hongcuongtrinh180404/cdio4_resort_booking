import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { BookingsService } from "./bookings.service";
import { CreateBookingDto } from "./dto/create-booking.dto";
import { QueryBookingDto } from "./dto/query-booking.dto";
import { UpdateBookingStatusDto } from "./dto/update-booking-status.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Role } from "../../common/enums";
import { JwtPayload } from "../auth/strategies/jwt.strategy";

@ApiTags("bookings")
@Controller("bookings")
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Create a booking" })
  create(@Body() dto: CreateBookingDto, @CurrentUser() user: JwtPayload) {
    return this.bookingsService.create(dto, user.sub);
  }

  @Get("my")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Get current user's bookings" })
  findByUser(@CurrentUser() user: JwtPayload) {
    return this.bookingsService.findByUser(user.sub);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EMPLOYEE, Role.ADMIN)
  @ApiOperation({ summary: "Get all bookings (EMPLOYEE/ADMIN)" })
  findAll(@Query() query: QueryBookingDto) {
    return this.bookingsService.findAll(query);
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Get booking by ID" })
  findOne(@Param("id") id: string) {
    return this.bookingsService.findById(Number(id));
  }

  @Patch(":id/cancel")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Cancel a booking" })
  cancel(@Param("id") id: string, @CurrentUser() user: JwtPayload) {
    return this.bookingsService.cancel(Number(id), user.sub, user.role);
  }

  @Patch(":id/status")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EMPLOYEE, Role.ADMIN)
  @ApiOperation({ summary: "Update booking status (check-in/out) — EMPLOYEE/ADMIN" })
  updateStatus(@Param("id") id: string, @Body() dto: UpdateBookingStatusDto) {
    return this.bookingsService.updateStatus(Number(id), dto.status);
  }
}
