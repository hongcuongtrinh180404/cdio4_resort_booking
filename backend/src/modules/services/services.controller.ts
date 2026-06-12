import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { ServicesService } from "./services.service";
import { CreateServiceDto } from "./dto/create-service.dto";
import { UpdateServiceDto } from "./dto/update-service.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/enums";
import { PaginationDto } from "../../common/dto/pagination.dto";

@ApiTags("services")
@Controller("services")
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  @ApiOperation({ summary: "Get all services" })
  findAll() {
    return this.servicesService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get service by id" })
  findOne(@Param("id") id: string) {
    return this.servicesService.findById(Number(id));
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EMPLOYEE, Role.ADMIN)
  @ApiOperation({ summary: "Create a service (EMPLOYEE/ADMIN)" })
  create(@Body() dto: CreateServiceDto) {
    return this.servicesService.create(dto);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EMPLOYEE, Role.ADMIN)
  @ApiOperation({ summary: "Update a service (EMPLOYEE/ADMIN)" })
  update(@Param("id") id: string, @Body() dto: UpdateServiceDto) {
    return this.servicesService.update(Number(id), dto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EMPLOYEE, Role.ADMIN)
  @ApiOperation({ summary: "Soft-delete a service (EMPLOYEE/ADMIN)" })
  remove(@Param("id") id: string) {
    return this.servicesService.remove(Number(id));
  }

  @Get("admin/all")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EMPLOYEE, Role.ADMIN)
  @ApiOperation({ summary: "Get all services including inactive (EMPLOYEE/ADMIN)" })
  findAllAdmin(@Query() pagination: PaginationDto) {
    return this.servicesService.findAllAdmin(pagination.page, pagination.limit);
  }
}
