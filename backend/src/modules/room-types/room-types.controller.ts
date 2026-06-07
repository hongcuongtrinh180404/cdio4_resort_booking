import { Controller, Get, Post, Patch, Param, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { RoomTypesService } from "./room-types.service";
import { CreateRoomTypeDto } from "./dto/create-room-type.dto";
import { UpdateRoomTypeDto } from "./dto/update-room-type.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/enums";

@ApiTags("room-types")
@Controller("room-types")
export class RoomTypesController {
  constructor(private readonly roomTypesService: RoomTypesService) {}

  @Get()
  @ApiOperation({ summary: "Get all room types" })
  findAll() {
    return this.roomTypesService.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EMPLOYEE, Role.ADMIN)
  @ApiOperation({ summary: "Create room type (EMPLOYEE/ADMIN)" })
  create(@Body() dto: CreateRoomTypeDto) {
    return this.roomTypesService.create(dto);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EMPLOYEE, Role.ADMIN)
  @ApiOperation({ summary: "Update room type (EMPLOYEE/ADMIN)" })
  update(@Param("id") id: string, @Body() dto: UpdateRoomTypeDto) {
    return this.roomTypesService.update(Number(id), dto);
  }
}
