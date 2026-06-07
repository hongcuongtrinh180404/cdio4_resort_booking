import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma/prisma.service";
import { CreateRoomDto } from "./dto/create-room.dto";
import { UpdateRoomDto } from "./dto/update-room.dto";
import { QueryRoomDto } from "./dto/query-room.dto";

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(query: QueryRoomDto) {
    const { roomTypeId, capacity, checkIn, checkOut } = query;
    return this.prisma.room.findMany({
      where: {
        status: "AVAILABLE",
        ...(roomTypeId && { roomTypeId }),
        ...(capacity && { capacity: { gte: capacity } }),
      },
      include: { roomType: true, images: { orderBy: { sortOrder: "asc" } } },
    });
  }

  async findById(id: number) {
    const room = await this.prisma.room.findUnique({
      where: { id },
      include: { roomType: true, images: { orderBy: { sortOrder: "asc" } } },
    });
    if (!room) throw new NotFoundException("Room not found");
    return room;
  }

  create(dto: CreateRoomDto) {
    return this.prisma.room.create({
      data: {
        roomNumber: dto.roomNumber,
        name: dto.name,
        roomTypeId: dto.roomTypeId,
        description: dto.description,
        capacity: dto.capacity,
        pricePerNight: dto.pricePerNight,
      },
      include: { roomType: true },
    });
  }

  async update(id: number, dto: UpdateRoomDto) {
    await this.findById(id);
    return this.prisma.room.update({
      where: { id },
      data: dto,
      include: { roomType: true },
    });
  }
}
