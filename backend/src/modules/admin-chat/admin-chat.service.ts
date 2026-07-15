import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma/prisma.service";
import { ChatGateway } from "../chat/chat.gateway";

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

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
        staff: { select: { id: true, fullName: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: [
        { supportRequested: "desc" }, // Yêu cầu hỗ trợ lên đầu
        { updatedAt: "desc" },
      ],
    });

    return conversations.map((c) => ({
      id: c.id,
      userId: c.userId,
      user: c.user,
      staff: c.staff,
      hasUnread: c.hasUnread,
      supportRequested: c.supportRequested,
      aiPausedUntil: c.aiPausedUntil,
      aiPaused: c.aiPausedUntil ? c.aiPausedUntil > new Date() : false,
      lastMessage: c.messages[0]?.content || null,
      lastMessageAt: c.messages[0]?.createdAt || c.updatedAt,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));
  }

  async getMessages(conversationId: number) {
    const conversation = await this.prisma.chatConversation.findUnique({
      where: { id: conversationId },
      include: { staff: { select: { id: true, fullName: true } } },
    });
    if (!conversation) throw new NotFoundException("Conversation not found");

    const messages = await this.prisma.chatMessage.findMany({
      where: { conversationId },
      include: {
        staff: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return {
      conversation: {
        ...conversation,
        aiPaused: conversation.aiPausedUntil ? conversation.aiPausedUntil > new Date() : false,
      },
      messages,
    };
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

    // Set AI pause: 6 giờ kể từ khi nhân viên trả lời
    const aiPausedUntil = new Date(Date.now() + SIX_HOURS_MS);

    await this.prisma.chatConversation.update({
      where: { id: conversationId },
      data: {
        hasUnread: true,
        updatedAt: new Date(),
        staffId,
        aiPausedUntil,
        // Xóa flag supportRequested khi nhân viên đã vào
        supportRequested: false,
      },
    });

    // Gửi tin nhắn đến khách hàng
    this.chatGateway.sendToUser(conversation.userId, "new_message", {
      role: "staff",
      content,
    });

    // Thông báo cho khách biết nhân viên đã tham gia
    this.chatGateway.sendToUser(conversation.userId, "staff_joined", {
      conversationId,
      staffId,
      aiPausedUntil,
    });

    // Thông báo cập nhật cho tất cả staff
    this.chatGateway.sendToStaff("new_message", {
      type: "staff_reply",
      conversationId,
    });

    return message;
  }

  async endSupport(conversationId: number, staffId: number) {
    const conversation = await this.prisma.chatConversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) throw new NotFoundException("Conversation not found");

    // Reset AI pause — AI hoạt động trở lại
    await this.prisma.chatConversation.update({
      where: { id: conversationId },
      data: {
        aiPausedUntil: null,
        staffId: null,
        updatedAt: new Date(),
      },
    });

    // Lưu tin nhắn hệ thống
    await this.prisma.chatMessage.create({
      data: {
        conversationId,
        role: "system",
        content: "[Nhân viên đã kết thúc hỗ trợ. Trợ lý AI đã hoạt động trở lại]",
      },
    });

    // Thông báo cho khách AI hoạt động lại
    this.chatGateway.sendToUser(conversation.userId, "ai_resumed", {
      conversationId,
    });

    // Thông báo cho staff
    this.chatGateway.sendToStaff("ai_resumed", {
      conversationId,
    });

    return { success: true, message: "Hỗ trợ đã kết thúc. AI trợ lý hoạt động trở lại." };
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
