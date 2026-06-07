import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma/prisma.service";
import { CreateRoomTypeDto } from "./dto/create-room-type.dto";
import { UpdateRoomTypeDto } from "./dto/update-room-type.dto";

@Injectable()
export class RoomTypesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.roomType.findMany({ include: { rooms: true } });
  }

  async findById(id: number) {
    const roomType = await this.prisma.roomType.findUnique({ where: { id } });
    if (!roomType) throw new NotFoundException("Room type not found");
    return roomType;
  }

  create(dto: CreateRoomTypeDto) {
    return this.prisma.roomType.create({ data: dto });
  }

  async update(id: number, dto: UpdateRoomTypeDto) {
    await this.findById(id);
    return this.prisma.roomType.update({ where: { id }, data: dto });
  }
}
