import { Controller, Post, Get, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { ChatService } from "./chat.service";
import { ChatDto, ConfirmBookingDto } from "./dto/chat.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtPayload } from "../auth/strategies/jwt.strategy";

@ApiTags("chat")
@Controller("chat")
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Send a message to AI concierge" })
  async chat(@Body() dto: ChatDto, @CurrentUser() user: JwtPayload) {
    return this.chatService.processMessage(dto.message, user.sub);
  }

  @Post("confirm-booking")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Confirm booking from AI proposal" })
  async confirmBooking(@Body() dto: ConfirmBookingDto, @CurrentUser() user: JwtPayload) {
    return this.chatService.confirmBooking(dto, user.sub);
  }

  @Post("request-support")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Request human staff support — pauses AI for 6 hours" })
  async requestSupport(@CurrentUser() user: JwtPayload) {
    return this.chatService.requestHumanSupport(user.sub);
  }

  @Get("conversation")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Get current user's active conversation with messages" })
  async getConversation(@CurrentUser() user: JwtPayload) {
    return this.chatService.getConversation(user.sub);
  }
}
