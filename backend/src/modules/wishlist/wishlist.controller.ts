import { Controller, Get, Post, Delete, Param, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { WishlistService } from "./wishlist.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtPayload } from "../auth/strategies/jwt.strategy";

@ApiTags("wishlist")
@UseGuards(JwtAuthGuard)
@Controller("wishlist")
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  @ApiOperation({ summary: "Get current user's wishlist" })
  findByUser(@CurrentUser() user: JwtPayload) {
    return this.wishlistService.findByUser(user.sub);
  }

  @Post(":roomId")
  @ApiOperation({ summary: "Add room to wishlist" })
  add(@CurrentUser() user: JwtPayload, @Param("roomId") roomId: string) {
    return this.wishlistService.add(user.sub, Number(roomId));
  }

  @Delete(":roomId")
  @ApiOperation({ summary: "Remove room from wishlist" })
  remove(@CurrentUser() user: JwtPayload, @Param("roomId") roomId: string) {
    return this.wishlistService.remove(user.sub, Number(roomId));
  }
}
