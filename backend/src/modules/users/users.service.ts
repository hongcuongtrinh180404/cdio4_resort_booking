import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma/prisma.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import * as bcrypt from "bcryptjs";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateUserDto) {
    return this.prisma.user.create({ data: dto });
  }

  findAll() {
    return this.prisma.user.findMany({
      select: { id: true, email: true, fullName: true, phone: true, address: true, role: true, createdAt: true },
    });
  }

  findById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, fullName: true, phone: true, address: true, role: true, createdAt: true },
    });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async update(id: number, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: { id: true, email: true, fullName: true, phone: true, address: true, role: true, createdAt: true },
    });
  }

  async changePassword(id: number, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new BadRequestException("User not found");

    const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isMatch) throw new BadRequestException("Current password is incorrect");

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return { message: "Password updated successfully" };
  }
}
