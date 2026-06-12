import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Groq from "groq-sdk";
import { PrismaService } from "../../database/prisma/prisma.service";
import { ChatGateway } from "./chat.gateway";
import { RoomsService } from "../rooms/rooms.service";
import { ServicesService } from "../services/services.service";
import { ServiceCombosService } from "../service-combos/service-combos.service";
import { BookingsService } from "../bookings/bookings.service";

@Injectable()
export class ChatService {
  private groq: Groq;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private chatGateway: ChatGateway,
    private roomsService: RoomsService,
    private servicesService: ServicesService,
    private serviceCombosService: ServiceCombosService,
    private bookingsService: BookingsService,
  ) {
    const apiKey = this.configService.get<string>("GROQ_API_KEY");
    if (!apiKey) throw new Error("GROQ_API_KEY not configured");
    this.groq = new Groq({ apiKey });
  }

  private functions = [
    {
      type: "function" as const,
      function: {
        name: "searchAvailableRooms",
        description: "Tìm phòng trống theo ngày, sức chứa, loại phòng và khoảng giá",
        parameters: {
          type: "object",
          properties: {
            checkIn: { type: "string", description: "Ngày nhận phòng (YYYY-MM-DD)" },
            checkOut: { type: "string", description: "Ngày trả phòng (YYYY-MM-DD)" },
            capacity: { type: "integer", description: "Số lượng khách tối thiểu" },
            roomTypeId: { type: "integer", description: "ID loại phòng" },
            minPrice: { type: "number", description: "Giá tối thiểu mỗi đêm (VNĐ)" },
            maxPrice: { type: "number", description: "Giá tối đa mỗi đêm (VNĐ)" },
          },
          required: ["checkIn", "checkOut"],
        },
      },
    },
    {
      type: "function" as const,
      function: {
        name: "getRoomDetail",
        description: "Xem chi tiết một phòng cụ thể",
        parameters: {
          type: "object",
          properties: {
            roomId: { type: "integer", description: "ID của phòng" },
          },
          required: ["roomId"],
        },
      },
    },
    {
      type: "function" as const,
      function: {
        name: "searchPackages",
        description: "Xem danh sách dịch vụ và combo hiện có",
        parameters: {
          type: "object",
          properties: {},
          required: [],
        },
      },
    },
    {
      type: "function" as const,
      function: {
        name: "createBooking",
        description: "Đặt phòng cho khách hàng. Chỉ gọi khi đã có đầy đủ thông tin phòng, ngày tháng và dịch vụ kèm theo.",
        parameters: {
          type: "object",
          properties: {
            roomId: { type: "integer", description: "ID của phòng muốn đặt" },
            checkInDate: { type: "string", description: "Ngày nhận phòng (YYYY-MM-DD)" },
            checkOutDate: { type: "string", description: "Ngày trả phòng (YYYY-MM-DD)" },
            serviceIds: {
              type: "array",
              items: { type: "integer" },
              description: "Danh sách ID dịch vụ muốn đặt kèm",
            },
            comboIds: {
              type: "array",
              items: { type: "integer" },
              description: "Danh sách ID combo muốn đặt kèm",
            },
          },
          required: ["roomId", "checkInDate", "checkOutDate"],
        },
      },
    },
  ];

  async processMessage(message: string, userId: number): Promise<{
    reply: string;
    action?: string;
    data?: any;
    redirectUrl?: string;
  }> {
    try {
      let conversation = await this.prisma.chatConversation.findFirst({
        where: { userId, status: "ACTIVE" },
      });

      if (!conversation) {
        conversation = await this.prisma.chatConversation.create({
          data: { userId },
        });
      }

      await this.prisma.chatMessage.create({
        data: {
          conversationId: conversation.id,
          role: "user",
          content: message,
        },
      });

      this.chatGateway.sendToStaff("new_message", {
        type: "user_message",
        userId,
        content: message,
      });

      const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
        {
          role: "system",
          content:
            "Bạn là trợ lý đặt phòng của khách sạn DTUVIVI. " +
            "Nhiệm vụ của bạn là hỗ trợ khách hàng tìm phòng, xem thông tin dịch vụ và đặt phòng. " +
            "Luôn trả lời bằng tiếng Việt, thân thiện và chuyên nghiệp. " +
            "Khi người dùng muốn đặt phòng, hãy thu thập đầy đủ thông tin: ngày check-in, ngày check-out, " +
            "loại phòng (nếu có), số lượng khách, dịch vụ kèm theo. " +
            "Khi khách yêu cầu đặt một phòng cụ thể, hãy hỏi ngày check-in và check-out trước " +
            "khi gọi createBooking. " +
            "Sau khi đặt phòng thành công, hãy thông báo mã đặt phòng và tổng tiền, " +
            "đồng thời hướng dẫn khách thanh toán. " +
            "Khi khách hỏi gợi ý combo/dịch vụ, hãy gọi searchPackages, xem kết quả trả về " +
            "và tư vấn dựa trên nhu cầu của khách (số người, dịch vụ ăn uống/spa...).",
        },
        { role: "user", content: message },
      ];

      let action: string | undefined;
      let actionData: any;
      let redirectUrl: string | undefined;

      const response = await this.groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages,
        tools: this.functions,
        tool_choice: "auto",
      });

      let choice = response.choices?.[0];
      let msg = choice?.message;

      while (msg?.tool_calls?.length) {
        const toolCall = msg.tool_calls[0];
        const name = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments);

        messages.push(msg);

        if (name === "createBooking") {
          const result = await this.executeBooking(args, userId);
          action = result.action;
          actionData = result.data;
          redirectUrl = result.redirectUrl;
          messages.push({
            role: "tool",
            content: JSON.stringify({
              success: true,
              bookingCode: result.data.bookingCode,
              totalAmount: Number(result.data.totalAmount),
              id: result.data.id,
            }),
            tool_call_id: toolCall.id,
          });
        } else {
          const result = await this.executeFunction(name, args, userId);
          action = result.action;
          actionData = result.data;
          messages.push({
            role: "tool",
            content: JSON.stringify(result.data),
            tool_call_id: toolCall.id,
          });
        }

        const nextResponse = await this.groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages,
          tools: this.functions,
          tool_choice: "auto",
        });

        choice = nextResponse.choices?.[0];
        msg = choice?.message;
      }

      const reply = msg?.content || "Xin lỗi, tôi không hiểu yêu cầu của bạn.";

      await this.prisma.chatMessage.create({
        data: {
          conversationId: conversation.id,
          role: "assistant",
          content: reply,
        },
      });

      this.chatGateway.sendToUser(userId, "new_message", {
        role: "assistant",
        content: reply,
        action,
        data: actionData,
        redirectUrl,
      });

      this.chatGateway.sendToStaff("new_message", {
        type: "ai_reply",
        userId,
        role: "assistant",
        content: reply,
        action,
        redirectUrl,
      });

      await this.prisma.chatConversation.update({
        where: { id: conversation.id },
        data: { hasUnread: true, updatedAt: new Date() },
      });

      return {
        reply,
        ...(action && { action }),
        ...(actionData && { data: actionData }),
        ...(redirectUrl && { redirectUrl }),
      };
    } catch (error: any) {
      console.error("ChatService error:", error);
      if (error.status === 429) {
        return {
          reply: "⚠️ API Groq đã vượt quá giới hạn yêu cầu. Vui lòng thử lại sau 30 giây.",
        };
      }
      if (error.status === 401 || error.status === 403) {
        return {
          reply: "⚠️ API key Groq không hợp lệ. Vui lòng kiểm tra lại GROQ_API_KEY.",
        };
      }
      return {
        reply: "Xin lỗi, hiện tại tôi đang gặp sự cố. Vui lòng thử lại sau.",
      };
    }
  }

  async getConversation(userId: number) {
    const conversation = await this.prisma.chatConversation.findFirst({
      where: { userId, status: "ACTIVE" },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
      },
    });
    return conversation;
  }

  private async executeFunction(name: string, args: any, userId: number) {
    switch (name) {
      case "searchAvailableRooms": {
        const rooms = await this.roomsService.findAll({
          checkIn: args.checkIn,
          checkOut: args.checkOut,
          capacity: args.capacity,
          roomTypeId: args.roomTypeId,
          minPrice: args.minPrice,
          maxPrice: args.maxPrice,
        });
        return {
          action: "rooms",
          data: rooms.map((r) => ({
            id: r.id,
            name: r.name,
            roomNumber: r.roomNumber,
            roomType: r.roomType?.name,
            capacity: r.capacity,
            pricePerNight: Number(r.pricePerNight),
            images: r.images?.map((i) => i.imageUrl) || [],
            amenities: r.amenities?.map((a) => a.amenity?.name) || [],
          })),
        };
      }

      case "getRoomDetail": {
        const room = await this.roomsService.findById(args.roomId);
        return {
          action: "roomDetail",
          data: {
            id: room.id,
            name: room.name,
            description: room.description,
            roomType: room.roomType?.name,
            capacity: room.capacity,
            pricePerNight: Number(room.pricePerNight),
            images: room.images?.map((i) => i.imageUrl) || [],
            amenities: room.amenities?.map((a) => ({
              name: a.amenity?.name,
              icon: a.amenity?.icon,
            })) || [],
          },
        };
      }

      case "searchPackages": {
        const services = await this.servicesService.findAll();
        const combos = await this.serviceCombosService.findAll();
        return {
          action: "packages",
          data: {
            services: services.map((s) => ({
              id: s.id,
              name: s.name,
              description: s.description,
              price: Number(s.price),
              imageUrls: s.imageUrls,
            })),
            combos: combos.map((c) => ({
              id: c.id,
              name: c.name,
              description: c.description,
              comboPrice: Number(c.comboPrice),
              imageUrls: c.imageUrls,
              services: (c as any).items?.map((item: any) => ({
                id: item.service?.id,
                name: item.service?.name,
                price: Number(item.service?.price),
              })) || [],
            })),
          },
        };
      }

      default:
        return { action: undefined, data: {} };
    }
  }

  private async executeBooking(args: any, userId: number) {
    const services = args.serviceIds?.map((id: number) => ({ serviceId: id, quantity: 1 })) || [];
    const combos = args.comboIds?.map((id: number) => ({ comboId: id, quantity: 1 })) || [];

    const booking = await this.bookingsService.create(
      {
        roomId: args.roomId,
        checkInDate: args.checkInDate,
        checkOutDate: args.checkOutDate,
        services,
        combos,
      },
      userId,
      2,
    );

    return {
      action: "booking",
      data: booking,
      redirectUrl: `/bookings/${booking.id}`,
    };
  }
}
