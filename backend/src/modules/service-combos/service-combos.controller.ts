import { Controller, Get, Post, Patch, Param, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { ServiceCombosService } from "./service-combos.service";
import { CreateServiceComboDto } from "./dto/create-service-combo.dto";
import { UpdateServiceComboDto } from "./dto/update-service-combo.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/enums";

@ApiTags("service-combos")
@Controller("service-combos")
export class ServiceCombosController {
  constructor(private readonly serviceCombosService: ServiceCombosService) {}

  @Get()
  @ApiOperation({ summary: "Get all service combos" })
  findAll() {
    return this.serviceCombosService.findAll();
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
}
