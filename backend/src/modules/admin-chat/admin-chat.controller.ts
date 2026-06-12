import { Controller, Get, Post, Patch, Param, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { AdminChatService } from "./admin-chat.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Role } from "../../common/enums";
import { JwtPayload } from "../auth/strategies/jwt.strategy";
import { IsString, IsNotEmpty } from "class-validator";

class StaffReplyDto {
  @IsString()
  @IsNotEmpty()
  content: string;
}

@ApiTags("admin-chat")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.EMPLOYEE, Role.ADMIN)
@Controller("admin/chat")
export class AdminChatController {
  constructor(private readonly adminChatService: AdminChatService) {}

  @Get("conversations")
  @ApiOperation({ summary: "Get all active conversations — EMPLOYEE/ADMIN" })
  getConversations() {
    return this.adminChatService.getConversations();
  }

  @Get(":id/messages")
  @ApiOperation({ summary: "Get messages for a conversation — EMPLOYEE/ADMIN" })
  getMessages(@Param("id") id: string) {
    return this.adminChatService.getMessages(Number(id));
  }

  @Post(":id/reply")
  @ApiOperation({ summary: "Staff reply to a conversation — EMPLOYEE/ADMIN" })
  staffReply(
    @Param("id") id: string,
    @Body() dto: StaffReplyDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.adminChatService.staffReply(Number(id), user.sub, dto.content);
  }

  @Patch(":id/read")
  @ApiOperation({ summary: "Mark conversation as read — EMPLOYEE/ADMIN" })
  markAsRead(@Param("id") id: string) {
    return this.adminChatService.markAsRead(Number(id));
  }
}
