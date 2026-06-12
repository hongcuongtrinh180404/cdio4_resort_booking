import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma/prisma.service";
import { ChatGateway } from "../chat/chat.gateway";

@Injectable()
export class AdminChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chatGateway: ChatGateway,
  ) {}

  async getConversations() {
    const conversations = await this.prisma.chatConversation.findMany({
      where: { status: "ACTIVE" },
      include: {
        user: { select: { id: true, email: true, fullName: true, phone: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { updatedAt: "desc" },
    });

    return conversations.map((c) => ({
      id: c.id,
      userId: c.userId,
      user: c.user,
      hasUnread: c.hasUnread,
      lastMessage: c.messages[0]?.content || null,
      lastMessageAt: c.messages[0]?.createdAt || c.updatedAt,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));
  }

  async getMessages(conversationId: number) {
    const conversation = await this.prisma.chatConversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) throw new NotFoundException("Conversation not found");

    const messages = await this.prisma.chatMessage.findMany({
      where: { conversationId },
      include: {
        staff: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return { conversation, messages };
  }

  async staffReply(conversationId: number, staffId: number, content: string) {
    const conversation = await this.prisma.chatConversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) throw new NotFoundException("Conversation not found");

    const message = await this.prisma.chatMessage.create({
      data: {
        conversationId,
        role: "staff",
        content,
        staffId,
      },
    });

    await this.prisma.chatConversation.update({
      where: { id: conversationId },
      data: { hasUnread: true, updatedAt: new Date() },
    });

    this.chatGateway.sendToUser(conversation.userId, "new_message", {
      role: "staff",
      content,
    });

    this.chatGateway.sendToStaff("new_message", {
      type: "staff_reply",
      conversationId,
    });

    return message;
  }

  async markAsRead(conversationId: number) {
    const conversation = await this.prisma.chatConversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) throw new NotFoundException("Conversation not found");

    await this.prisma.chatConversation.update({
      where: { id: conversationId },
      data: { hasUnread: false },
    });

    return { success: true };
  }
}
