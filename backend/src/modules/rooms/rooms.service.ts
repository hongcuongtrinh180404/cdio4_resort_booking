import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma/prisma.service";
import { CreateRoomDto } from "./dto/create-room.dto";
import { UpdateRoomDto } from "./dto/update-room.dto";
import { QueryRoomDto } from "./dto/query-room.dto";

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryRoomDto) {
    const { roomTypeId, capacity, checkIn, checkOut, amenityIds } = query;

    const where: any = {
      status: "AVAILABLE",
      ...(roomTypeId && { roomTypeId }),
      ...(capacity && { capacity: { gte: capacity } }),
    };

    // AND filter — room must have ALL selected amenities
    if (amenityIds) {
      const ids = amenityIds.split(",").map(Number).filter((n) => !isNaN(n));
      if (ids.length > 0) {
        where.AND = ids.map((id) => ({
          amenities: { some: { amenityId: id } },
        }));
      }
    }

    return this.prisma.room.findMany({
      where,
      include: {
        roomType: true,
        images: { orderBy: { sortOrder: "asc" } },
        amenities: { include: { amenity: true } },
      },
    });
  }

  async findById(id: number) {
    const room = await this.prisma.room.findUnique({
      where: { id },
      include: {
        roomType: true,
        images: { orderBy: { sortOrder: "asc" } },
        amenities: { include: { amenity: true } },
      },
    });
    if (!room) throw new NotFoundException("Room not found");
    return room;
  }

  async findAllAmenities() {
    return this.prisma.amenity.findMany({ orderBy: { name: "asc" } });
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
