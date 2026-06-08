import { Controller, Get, Post, Patch, Param, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { ServicesService } from "./services.service";
import { CreateServiceDto } from "./dto/create-service.dto";
import { UpdateServiceDto } from "./dto/update-service.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/enums";

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
}
