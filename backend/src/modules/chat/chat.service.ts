import { Injectable, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Groq from "groq-sdk";
import { PrismaService } from "../../database/prisma/prisma.service";
import { ChatGateway } from "./chat.gateway";
import { RoomsService } from "../rooms/rooms.service";
import { ServicesService } from "../services/services.service";
import { ServiceCombosService } from "../service-combos/service-combos.service";
import { BookingsService } from "../bookings/bookings.service";
import { ConfirmBookingDto } from "./dto/chat.dto";
import { BookingStatus } from "../../common/enums/booking-status.enum";

@Injectable()
export class ChatService {
  private groqClients: Groq[];

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private chatGateway: ChatGateway,
    private roomsService: RoomsService,
    private servicesService: ServicesService,
    private serviceCombosService: ServiceCombosService,
    private bookingsService: BookingsService,
  ) {
    const keys = [
      this.configService.get<string>("GROQ_API_KEY"),
      this.configService.get<string>("GROQ_API_KEY_2"),
      this.configService.get<string>("GROQ_API_KEY_3"),
    ].filter((k): k is string => !!k);

    if (keys.length === 0) throw new Error("No GROQ_API_KEY configured");
    this.groqClients = keys.map((key) => new Groq({ apiKey: key }));
  }

  private functions = [
    {
      type: "function" as const,
      function: {
        name: "searchAvailableRooms",
        description: "Tìm phòng trống theo ngày, sức chứa, loại phòng, khoảng giá và tiện nghi",
        parameters: {
          type: "object",
          properties: {
            checkIn: { type: "string", description: "Ngày nhận phòng (YYYY-MM-DD). Chỉ dùng khi khách cung cấp ngày cụ thể." },
            checkOut: { type: "string", description: "Ngày trả phòng (YYYY-MM-DD). Chỉ dùng khi khách cung cấp ngày cụ thể." },
            capacity: { type: "integer", description: "Số lượng khách tối thiểu (>= 1). Chỉ dùng khi khách yêu cầu.", minimum: 1 },
            roomTypeId: { type: "integer", description: "ID loại phòng (>= 1). Chỉ dùng khi khách yêu cầu loại phòng cụ thể.", minimum: 1 },
            minPrice: { type: "number", description: "Giá tối thiểu mỗi đêm (VNĐ). Chỉ dùng khi khách yêu cầu cụ thể.", minimum: 0 },
            maxPrice: { type: "number", description: "Giá tối đa mỗi đêm (VNĐ). Chỉ dùng khi khách yêu cầu cụ thể.", minimum: 0 },
            amenityIds: { type: "string", description: "Danh sách ID tiện nghi, cách nhau bằng dấu phẩy. Ví dụ: '1,3,5'. Dùng searchAmenities để tra cứu ID. Chỉ dùng khi khách yêu cầu tiện nghi." },
          },
          required: [],
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
        name: "searchAmenities",
        description: "Xem danh sách tất cả tiện nghi (amenities) của khách sạn.",
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
        name: "proposeBooking",
        description: "Kiểm tra phòng còn trống và đề xuất đặt phòng cho khách. Chỉ gọi khi đã có phòng, ngày check-in và check-out. Nhận ID phòng (số) hoặc tên/số phòng (chữ).",
        parameters: {
          type: "object",
          properties: {
            roomId: { type: "string", description: "ID phòng (số) hoặc tên/số phòng (chữ). VD: '5', 'D101', 'Peaceful Family Suite'" },
            checkInDate: { type: "string", description: "Ngày nhận phòng (YYYY-MM-DD)" },
            checkOutDate: { type: "string", description: "Ngày trả phòng (YYYY-MM-DD)" },
          },
          required: ["roomId", "checkInDate", "checkOutDate"],
        },
      },
    },
  ];

  private async callGroqWithFallback(messages: any[], tools: any[]) {
    let lastError: any;
    for (let i = 0; i < this.groqClients.length; i++) {
      try {
        return await this.groqClients[i].chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages,
          tools,
          tool_choice: "auto",
        });
      } catch (e: any) {
        lastError = e;
        if (e.status === 429) {
          console.warn(`[ChatService] Groq key ${i + 1} rate limited, trying next...`);
          continue;
        }
        throw e;
      }
    }
    throw lastError;
  }

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

      const previousMessages = await this.prisma.chatMessage.findMany({
        where: { conversationId: conversation.id, role: "user" },
        orderBy: { createdAt: "desc" },
        take: 6,
      });

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

      const messages: any[] = [
        {
          role: "system",
          content:
            "Bạn là trợ lý đặt phòng của khách sạn DTUVIVU. " +
            "Nhiệm vụ của bạn là hỗ trợ khách hàng tìm phòng, xem thông tin dịch vụ và đặt phòng. " +
            "Luôn trả lời bằng tiếng Việt, thân thiện và chuyên nghiệp. " +
            "Khi khách hỏi tìm phòng, hãy gọi searchAvailableRooms ngay với thông tin khách đã cung cấp. " +
            "Không hỏi thêm thông tin tiện nghi, dịch vụ hay combo trừ khi khách yêu cầu. " +
            "Ví dụ: khách nói 'phòng dưới 2 triệu cho 2 người' → gọi searchAvailableRooms với capacity=2, maxPrice=2000000. " +
            "Khi khách yêu cầu đặt một phòng cụ thể, hãy hỏi ngày check-in và check-out trước " +
            "khi gọi proposeBooking. " +
            "Khi khách yêu cầu đặt phòng bằng tên hoặc số phòng (VD: D101, Deluxe 201), " +
            "hãy gọi thẳng proposeBooking với roomId là tên hoặc số phòng đó. " +
            "Sau khi proposeBooking trả về thành công, hãy thông báo phòng còn trống và tổng tiền dự kiến, " +
            "đồng thời hướng dẫn khách nhấn nút 'Đặt ngay' để xác nhận. " +
            "Chỉ proposeBooking để khách xác nhận, không tự ý tạo booking. " +
            "Khi khách hỏi gợi ý combo/dịch vụ, hãy gọi searchPackages và tư vấn dựa trên nhu cầu. " +
            "Không gửi giá trị 0 hoặc mặc định cho các tham số.",
        },
        ...previousMessages.reverse().map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
        { role: "user", content: message },
      ];

      let action: string | undefined;
      let actionData: any;
      let redirectUrl: string | undefined;

      const response = await this.callGroqWithFallback(messages, this.functions);

      let choice = response.choices?.[0];
      let msg = choice?.message;

      while (msg?.tool_calls?.length) {
        const toolCall = msg.tool_calls[0];
        const name = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments);

        messages.push(msg);

        if (name === "proposeBooking") {
          const result = await this.proposeBooking(args, userId);
          action = result.action;
          actionData = result.data;
          redirectUrl = undefined;

          const toolContent: any = { available: result.data.available, roomName: result.data.roomName, roomId: result.data.roomId };
          if (result.data.available) {
            toolContent.estimatedTotal = result.data.estimatedTotal;
            toolContent.numberOfNights = result.data.numberOfNights;
            toolContent.checkInDate = result.data.checkInDate;
            toolContent.checkOutDate = result.data.checkOutDate;
          } else {
            toolContent.message = result.data.message;
          }

          messages.push({
            role: "tool",
            content: JSON.stringify(toolContent),
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

        const nextResponse = await this.callGroqWithFallback(messages, this.functions);

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
          reply: "⚠️ Hệ thống AI đã vượt quá giới hạn yêu cầu. Vui lòng thử lại sau 30 giây.",
        };
      }
      if (error.status === 401 || error.status === 403) {
        return {
          reply: "⚠️ API key AI không hợp lệ. Vui lòng kiểm tra lại cấu hình.",
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
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const rooms = await this.roomsService.findAll({
          checkIn: args.checkIn || today.toISOString().split("T")[0],
          checkOut: args.checkOut || tomorrow.toISOString().split("T")[0],
          capacity: args.capacity,
          roomTypeId: args.roomTypeId,
          minPrice: args.minPrice,
          maxPrice: args.maxPrice,
          amenityIds: args.amenityIds,
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

      case "searchAmenities": {
        const amenities = await this.roomsService.findAllAmenities();
        return {
          action: "amenities",
          data: amenities.map((a) => ({
            id: a.id,
            name: a.name,
            icon: a.icon,
          })),
        };
      }

      default:
        return { action: undefined, data: {} };
    }
  }

  private async proposeBooking(args: any, userId: number) {
    const roomId = Number(args.roomId);
    let room;

    if (!isNaN(roomId)) {
      room = await this.prisma.room.findUnique({ where: { id: roomId } });
    } else {
      const query = String(args.roomId);
      room = await this.prisma.room.findFirst({
        where: {
          OR: [
            { roomNumber: query },
            { name: { contains: query } },
          ],
        },
      });
    }

    if (!room) throw new BadRequestException("Không tìm thấy phòng");

    const checkInDate = new Date(args.checkInDate);
    const checkOutDate = new Date(args.checkOutDate);
    const numberOfNights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    if (numberOfNights < 1) throw new BadRequestException("Invalid dates");

    const conflicting = await this.prisma.booking.findFirst({
      where: {
        roomId: room.id,
        status: { notIn: [BookingStatus.CANCELLED] },
        checkInDate: { lt: checkOutDate },
        checkOutDate: { gt: checkInDate },
      },
      select: { id: true },
    });
    if (conflicting) {
      return {
        action: "booking_proposal",
        data: {
          available: false,
          roomId: room.id,
          roomName: room.name,
          message: `Phòng ${room.name} đã có người đặt trong khoảng ${args.checkInDate} đến ${args.checkOutDate}.`,
        },
      };
    }

    const roomPrice = Number(room.pricePerNight);
    const estimatedTotal = roomPrice * numberOfNights;

    return {
      action: "booking_proposal",
      data: {
        available: true,
        roomId: room.id,
        roomName: room.name,
        checkInDate: args.checkInDate,
        checkOutDate: args.checkOutDate,
        numberOfNights,
        estimatedTotal,
      },
    };
  }

  async confirmBooking(dto: ConfirmBookingDto, userId: number) {
    const services = dto.serviceIds?.map((id: number) => ({ serviceId: id, quantity: 1 })) || [];
    const combos = dto.comboIds?.map((id: number) => ({ comboId: id, quantity: 1 })) || [];

    const booking = await this.bookingsService.create(
      {
        roomId: dto.roomId,
        checkInDate: dto.checkInDate,
        checkOutDate: dto.checkOutDate,
        services,
        combos,
      },
      userId,
      2,
    );

    return {
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      totalAmount: Number(booking.totalAmount),
    };
  }
}
