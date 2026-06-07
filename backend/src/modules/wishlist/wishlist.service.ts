import { Injectable, ConflictException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma/prisma.service";

@Injectable()
export class WishlistService {
  constructor(private readonly prisma: PrismaService) {}

  findByUser(userId: number) {
    return this.prisma.wishlist.findMany({
      where: { userId },
      include: { room: { include: { roomType: true, images: { orderBy: { sortOrder: "asc" } } } } },
    });
  }

  async add(userId: number, roomId: number) {
    const existing = await this.prisma.wishlist.findUnique({
      where: { userId_roomId: { userId, roomId } },
    });
    if (existing) throw new ConflictException("Room already in wishlist");
    return this.prisma.wishlist.create({ data: { userId, roomId } });
  }

  async remove(userId: number, roomId: number) {
    await this.prisma.wishlist.deleteMany({ where: { userId, roomId } });
    return { message: "Removed from wishlist" };
  }
}
