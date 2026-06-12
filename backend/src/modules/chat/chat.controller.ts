import { Controller, Post, Get, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { ChatService } from "./chat.service";
import { ChatDto } from "./dto/chat.dto";
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

  @Get("conversation")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Get current user's active conversation with messages" })
  async getConversation(@CurrentUser() user: JwtPayload) {
    return this.chatService.getConversation(user.sub);
  }
}
