import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { RoomsService } from "./rooms.service";
import { CreateRoomDto } from "./dto/create-room.dto";
import { UpdateRoomDto } from "./dto/update-room.dto";
import { UpdateRoomStatusDto } from "./dto/update-room-status.dto";
import { AddRoomImageDto } from "./dto/add-room-image.dto";
import { QueryRoomDto } from "./dto/query-room.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/enums";

@ApiTags("rooms")
@Controller("rooms")
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get()
  @ApiOperation({ summary: "Search available rooms" })
  findAll(@Query() query: QueryRoomDto) {
    return this.roomsService.findAll(query);
  }

  @Get(":id/availability")
  @ApiOperation({ summary: "Get occupied date ranges for a room" })
  getAvailability(@Param("id") id: string) {
    return this.roomsService.getAvailability(Number(id));
  }

  @Get("amenities")
  @ApiOperation({ summary: "Get all amenities for filtering" })
  findAllAmenities() {
    return this.roomsService.findAllAmenities();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get room by ID" })
  findOne(@Param("id") id: string) {
    return this.roomsService.findById(Number(id));
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EMPLOYEE, Role.ADMIN)
  @ApiOperation({ summary: "Create a room (EMPLOYEE/ADMIN)" })
  create(@Body() dto: CreateRoomDto) {
    return this.roomsService.create(dto);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EMPLOYEE, Role.ADMIN)
  @ApiOperation({ summary: "Update a room (EMPLOYEE/ADMIN)" })
  update(@Param("id") id: string, @Body() dto: UpdateRoomDto) {
    return this.roomsService.update(Number(id), dto);
  }

  @Patch(":id/status")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EMPLOYEE, Role.ADMIN)
  @ApiOperation({ summary: "Update room status (EMPLOYEE/ADMIN)" })
  updateStatus(@Param("id") id: string, @Body() dto: UpdateRoomStatusDto) {
    return this.roomsService.updateStatus(Number(id), dto.status);
  }

  @Post(":id/images")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EMPLOYEE, Role.ADMIN)
  @ApiOperation({ summary: "Add image to room (EMPLOYEE/ADMIN)" })
  addImage(@Param("id") id: string, @Body() dto: AddRoomImageDto) {
    return this.roomsService.addImage(Number(id), dto.imageUrl, dto.sortOrder);
  }

  @Delete("images/:imageId")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EMPLOYEE, Role.ADMIN)
  @ApiOperation({ summary: "Remove image from room (EMPLOYEE/ADMIN)" })
  removeImage(@Param("imageId") imageId: string) {
    return this.roomsService.removeImage(Number(imageId));
  }
}
