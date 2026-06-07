import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma/prisma.service";
import { CreateServiceComboDto } from "./dto/create-service-combo.dto";
import { UpdateServiceComboDto } from "./dto/update-service-combo.dto";

@Injectable()
export class ServiceCombosService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.serviceCombo.findMany({
      where: { isActive: true },
      include: { items: { include: { service: true } } },
    });
  }

  async findById(id: number) {
    const combo = await this.prisma.serviceCombo.findUnique({
      where: { id },
      include: { items: { include: { service: true } } },
    });
    if (!combo) throw new NotFoundException("Service combo not found");
    return combo;
  }

  create(dto: CreateServiceComboDto) {
    const { serviceIds, ...data } = dto;
    return this.prisma.serviceCombo.create({
      data: {
        ...data,
        items: {
          create: serviceIds.map((serviceId) => ({ serviceId })),
        },
      },
      include: { items: { include: { service: true } } },
    });
  }

  async update(id: number, dto: UpdateServiceComboDto) {
    await this.findById(id);
    const { serviceIds, ...data } = dto;
    if (serviceIds) {
      await this.prisma.serviceComboItem.deleteMany({ where: { comboId: id } });
      await this.prisma.serviceComboItem.createMany({
        data: serviceIds.map((serviceId) => ({ comboId: id, serviceId })),
      });
    }
    return this.prisma.serviceCombo.update({
      where: { id },
      data,
      include: { items: { include: { service: true } } },
    });
  }
}
