import { Injectable, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PrismaService } from "../../database/prisma/prisma.service";
import { ChatGateway } from "./chat.gateway";
import { RoomsService } from "../rooms/rooms.service";
import { ServicesService } from "../services/services.service";
import { ServiceCombosService } from "../service-combos/service-combos.service";
import { BookingsService } from "../bookings/bookings.service";
import { ConfirmBookingDto } from "./dto/chat.dto";
import { BookingStatus } from "../../common/enums/booking-status.enum";

interface ModelResult {
  content: string | null;
  toolCalls: Array<{ id: string; name: string; args: string }> | null;
}

interface ModelProvider {
  name: string;
  call: (messages: any[], tools: any[]) => Promise<ModelResult>;
}

@Injectable()
export class ChatService {
  private groq: Groq;
  private modelProviders: ModelProvider[];

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private chatGateway: ChatGateway,
    private roomsService: RoomsService,
    private servicesService: ServicesService,
    private serviceCombosService: ServiceCombosService,
    private bookingsService: BookingsService,
  ) {
    const groqKey = this.configService.get<string>("GROQ_API_KEY");
    if (!groqKey) throw new Error("GROQ_API_KEY not configured");
    this.groq = new Groq({ apiKey: groqKey });

    this.modelProviders = [
      { name: "groq (llama-3.3-70b-versatile)", call: (m, t) => this.callGroq(m, t) },
    ];

    const googleKey = this.configService.get<string>("GOOGLE_API_KEY");
    if (googleKey) {
      const googleAI = new GoogleGenerativeAI(googleKey);
      this.modelProviders.push(
        { name: "gemini (gemini-2.5-flash-001)", call: (m, t) => this.callGemini(m, t, googleAI, "gemini-2.5-flash-001") },
        { name: "gemini (gemini-2.0-flash)", call: (m, t) => this.callGemini(m, t, googleAI, "gemini-2.0-flash") },
      );
    }
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
            checkIn: { type: "string", description: "Ngày nhận phòng (YYYY-MM-DD)" },
            checkOut: { type: "string", description: "Ngày trả phòng (YYYY-MM-DD)" },
            capacity: { type: "integer", description: "Số lượng khách tối thiểu (>= 1). Chỉ dùng khi khách yêu cầu.", minimum: 1 },
            roomTypeId: { type: "integer", description: "ID loại phòng (>= 1). Chỉ dùng khi khách yêu cầu loại phòng cụ thể.", minimum: 1 },
            minPrice: { type: "number", description: "Giá tối thiểu mỗi đêm (VNĐ). Chỉ dùng khi khách yêu cầu cụ thể.", minimum: 0 },
            maxPrice: { type: "number", description: "Giá tối đa mỗi đêm (VNĐ). Chỉ dùng khi khách yêu cầu cụ thể.", minimum: 0 },
            amenityIds: { type: "string", description: "Danh sách ID tiện nghi, cách nhau bằng dấu phẩy. Ví dụ: '1,3,5'. Dùng searchAmenities để tra cứu ID. Chỉ dùng khi khách yêu cầu tiện nghi." },
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
        name: "searchAmenities",
        description: "Xem danh sách tất cả tiện nghi (amenities) của khách sạn để lấy ID tiện nghi.",
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
        description: "Kiểm tra phòng còn trống và đề xuất đặt phòng cho khách. Chỉ gọi khi đã có phòng, ngày check-in và check-out.",
        parameters: {
          type: "object",
          properties: {
            roomId: { type: "integer", description: "ID của phòng muốn đặt" },
            checkInDate: { type: "string", description: "Ngày nhận phòng (YYYY-MM-DD)" },
            checkOutDate: { type: "string", description: "Ngày trả phòng (YYYY-MM-DD)" },
          },
          required: ["roomId", "checkInDate", "checkOutDate"],
        },
      },
    },
  ];

  private async callWithFallback(messages: any[], tools: any[]): Promise<ModelResult> {
    let lastError: any;
    for (const provider of this.modelProviders) {
      try {
        return await provider.call(messages, tools);
      } catch (e: any) {
        lastError = e;
        console.warn(`[ChatService] ${provider.name} failed:`, e.message);
      }
    }
    throw lastError;
  }

  private async callGroq(messages: any[], tools: any[]): Promise<ModelResult> {
    const response = await this.groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      tools,
      tool_choice: "auto",
    });
    const choice = response.choices?.[0];
    const msg = choice?.message;
    return {
      content: msg?.content ?? null,
      toolCalls: msg?.tool_calls?.map((tc) => ({
        id: tc.id,
        name: tc.function.name,
        args: tc.function.arguments,
      })) ?? null,
    };
  }

  private async callGemini(messages: any[], tools: any[], googleAI: GoogleGenerativeAI, modelName: string): Promise<ModelResult> {
    const { contents, systemInstruction } = this.toGeminiContents(messages);
    const geminiTools = this.toGeminiTools(tools);

    const model = googleAI.getGenerativeModel({
      model: modelName,
      systemInstruction,
      tools: geminiTools,
    });

    const result = await model.generateContent({ contents });
    const candidate = result.response.candidates?.[0];
    if (!candidate) throw new Error("No response from Gemini");

    return {
      content: this.extractGeminiText(candidate),
      toolCalls: this.extractGeminiToolCalls(candidate),
    };
  }

  private toGeminiContents(messages: any[]): { contents: any[]; systemInstruction?: string } {
    const contents: any[] = [];
    let systemInstruction: string | undefined;

    const callIdToFn = new Map<string, string>();
    for (const msg of messages) {
      if (msg.role === "assistant" && msg.tool_calls) {
        for (const tc of msg.tool_calls) {
          callIdToFn.set(tc.id, tc.function.name);
        }
      }
    }

    for (const msg of messages) {
      if (msg.role === "system") {
        systemInstruction = msg.content;
        continue;
      }
      if (msg.role === "user" && typeof msg.content === "string") {
        contents.push({ role: "user", parts: [{ text: msg.content }] });
      } else if (msg.role === "assistant") {
        const parts: any[] = [];
        if (msg.content) parts.push({ text: msg.content });
        if (msg.tool_calls) {
          for (const tc of msg.tool_calls) {
            parts.push({ functionCall: { name: tc.function.name, args: JSON.parse(tc.function.arguments) } });
          }
        }
        contents.push({ role: "model", parts });
      } else if (msg.role === "tool") {
        const fnName = callIdToFn.get(msg.tool_call_id);
        if (fnName) {
          contents.push({
            role: "user",
            parts: [{ functionResponse: { name: fnName, response: JSON.parse(msg.content) } }],
          });
        }
      }
    }

    return { contents, systemInstruction };
  }

  private toGeminiTools(tools: any[]): any[] {
    return [{
      functionDeclarations: tools.map((t: any) => t.function),
    }];
  }

  private extractGeminiText(candidate: any): string | null {
    const textPart = candidate.content.parts.find((p: any) => p.text);
    return textPart?.text ?? null;
  }

  private extractGeminiToolCalls(candidate: any): ModelResult["toolCalls"] {
    const functionCalls = candidate.content.parts.filter((p: any) => p.functionCall);
    if (!functionCalls.length) return null;
    return functionCalls.map((fc: any, i: number) => ({
      id: `gemini-${i}`,
      name: fc.functionCall.name,
      args: JSON.stringify(fc.functionCall.args),
    }));
  }

  private buildAssistantMessage(result: ModelResult): any {
    const msg: any = { role: "assistant" };
    if (result.content) msg.content = result.content;
    if (result.toolCalls) {
      msg.tool_calls = result.toolCalls.map((tc) => ({
        id: tc.id,
        type: "function",
        function: { name: tc.name, arguments: tc.args },
      }));
    }
    return msg;
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
            "Bạn là trợ lý đặt phòng của khách sạn DTUVIVI. " +
            "Nhiệm vụ của bạn là hỗ trợ khách hàng tìm phòng, xem thông tin dịch vụ và đặt phòng. " +
            "Luôn trả lời bằng tiếng Việt, thân thiện và chuyên nghiệp. " +
            "Khi người dùng muốn đặt phòng, hãy thu thập đầy đủ thông tin: ngày check-in, ngày check-out, " +
            "loại phòng (nếu có), số lượng khách, dịch vụ kèm theo. " +
            "Khi khách yêu cầu đặt một phòng cụ thể, hãy hỏi ngày check-in và check-out trước " +
            "khi gọi proposeBooking. " +
            "Sau khi proposeBooking trả về thành công, hãy thông báo phòng còn trống và tổng tiền dự kiến, " +
            "đồng thời hướng dẫn khách nhấn nút 'Đặt ngay' để xác nhận. " +
            "Chỉ proposeBooking để khách xác nhận, không tự ý tạo booking. " +
            "Khi khách hỏi gợi ý combo/dịch vụ, hãy gọi searchPackages, xem kết quả trả về " +
            "và tư vấn dựa trên nhu cầu của khách (số người, dịch vụ ăn uống/spa...). " +
            "Khi khách muốn tìm phòng theo tiện nghi (ví dụ: view biển, hồ bơi...), hãy gọi searchAmenities trước " +
            "để lấy ID tiện nghi, sau đó dùng amenityIds trong searchAvailableRooms. " +
            "Lưu ý: Chỉ gửi các tham số roomTypeId, capacity, minPrice, maxPrice, amenityIds khi khách yêu cầu cụ thể. " +
            "Không gửi giá trị 0 hoặc mặc định.",
        },
        { role: "user", content: message },
      ];

      let action: string | undefined;
      let actionData: any;
      let redirectUrl: string | undefined;

      let modelResult = await this.callWithFallback(messages, this.functions);

      while (modelResult.toolCalls?.length) {
        const toolCall = modelResult.toolCalls[0];
        const name = toolCall.name;
        const args = JSON.parse(toolCall.args);

        messages.push(this.buildAssistantMessage(modelResult));

        if (name === "proposeBooking") {
          const result = await this.proposeBooking(args, userId);
          action = result.action;
          actionData = result.data;
          redirectUrl = undefined;
          messages.push({
            role: "tool",
            content: JSON.stringify({
              available: true,
              roomName: result.data.roomName,
              roomId: result.data.roomId,
              estimatedTotal: result.data.estimatedTotal,
              numberOfNights: result.data.numberOfNights,
              checkInDate: result.data.checkInDate,
              checkOutDate: result.data.checkOutDate,
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

        modelResult = await this.callWithFallback(messages, this.functions);
      }

      const reply = modelResult.content || "Xin lỗi, tôi không hiểu yêu cầu của bạn.";

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
    const room = await this.roomsService.findById(args.roomId);
    if (!room) throw new BadRequestException("Room not found");

    const checkInDate = new Date(args.checkInDate);
    const checkOutDate = new Date(args.checkOutDate);
    const numberOfNights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    if (numberOfNights < 1) throw new BadRequestException("Invalid dates");

    const conflicting = await this.prisma.booking.findFirst({
      where: {
        roomId: args.roomId,
        status: { notIn: [BookingStatus.CANCELLED] },
        checkInDate: { lt: checkOutDate },
        checkOutDate: { gt: checkInDate },
      },
      select: { id: true },
    });
    if (conflicting) throw new BadRequestException("Phòng đã có người đặt trong khoảng thời gian này");

    const roomPrice = Number(room.pricePerNight);
    const estimatedTotal = roomPrice * numberOfNights;

    return {
      action: "booking_proposal",
      data: {
        roomId: args.roomId,
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
