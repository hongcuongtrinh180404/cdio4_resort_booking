import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { ServiceCombosService } from "./service-combos.service";
import { CreateServiceComboDto } from "./dto/create-service-combo.dto";
import { UpdateServiceComboDto } from "./dto/update-service-combo.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/enums";
import { PaginationDto } from "../../common/dto/pagination.dto";

@ApiTags("service-combos")
@Controller("service-combos")
export class ServiceCombosController {
  constructor(private readonly serviceCombosService: ServiceCombosService) {}

  @Get()
  @ApiOperation({ summary: "Get all service combos" })
  findAll() {
    return this.serviceCombosService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get service combo by id" })
  findOne(@Param("id") id: string) {
    return this.serviceCombosService.findById(Number(id));
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EMPLOYEE, Role.ADMIN)
  @ApiOperation({ summary: "Create a service combo (EMPLOYEE/ADMIN)" })
  create(@Body() dto: CreateServiceComboDto) {
    return this.serviceCombosService.create(dto);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EMPLOYEE, Role.ADMIN)
  @ApiOperation({ summary: "Update a service combo (EMPLOYEE/ADMIN)" })
  update(@Param("id") id: string, @Body() dto: UpdateServiceComboDto) {
    return this.serviceCombosService.update(Number(id), dto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EMPLOYEE, Role.ADMIN)
  @ApiOperation({ summary: "Soft-delete a service combo (EMPLOYEE/ADMIN)" })
  remove(@Param("id") id: string) {
    return this.serviceCombosService.remove(Number(id));
  }

  @Get("admin/all")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EMPLOYEE, Role.ADMIN)
  @ApiOperation({ summary: "Get all service combos including inactive (EMPLOYEE/ADMIN)" })
  findAllAdmin(@Query() pagination: PaginationDto) {
    return this.serviceCombosService.findAllAdmin(pagination.page, pagination.limit);
  }
}
