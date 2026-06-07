import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma/prisma.service";
import { CreateVoucherDto } from "./dto/create-voucher.dto";
import { UpdateVoucherDto } from "./dto/update-voucher.dto";

@Injectable()
export class VouchersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.voucher.findMany();
  }

  async validateCode(code: string) {
    const voucher = await this.prisma.voucher.findUnique({ where: { code } });
    if (!voucher) throw new NotFoundException("Voucher not found");
    if (!voucher.isActive) throw new BadRequestException("Voucher is inactive");
    if (voucher.usedCount >= voucher.maxUsage) throw new BadRequestException("Voucher usage limit reached");
    const now = new Date();
    if (now < voucher.startDate || now > voucher.endDate) {
      throw new BadRequestException("Voucher is not valid at this time");
    }
    return voucher;
  }

  create(dto: CreateVoucherDto) {
    return this.prisma.voucher.create({
      data: {
        ...dto,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
      },
    });
  }

  async update(id: number, dto: UpdateVoucherDto) {
    const voucher = await this.prisma.voucher.findUnique({ where: { id } });
    if (!voucher) throw new NotFoundException("Voucher not found");
    return this.prisma.voucher.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.startDate && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate && { endDate: new Date(dto.endDate) }),
      },
    });
  }
}
