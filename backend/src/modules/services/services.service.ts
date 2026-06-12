import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma/prisma.service";
import { CreateServiceDto } from "./dto/create-service.dto";
import { UpdateServiceDto } from "./dto/update-service.dto";

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.service.findMany({ where: { isActive: true } });
  }

  async findById(id: number) {
    const service = await this.prisma.service.findUnique({ where: { id } });
    if (!service) throw new NotFoundException("Service not found");
    return service;
  }

  create(dto: CreateServiceDto) {
    return this.prisma.service.create({ data: dto });
  }

  async update(id: number, dto: UpdateServiceDto) {
    await this.findById(id);
    return this.prisma.service.update({ where: { id }, data: dto });
  }

  async findAllAdmin(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.service.findMany({ skip, take: limit, orderBy: { createdAt: "desc" } }),
      this.prisma.service.count(),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async remove(id: number) {
    await this.findById(id);
    return this.prisma.service.update({ where: { id }, data: { isActive: false } });
  }
}
