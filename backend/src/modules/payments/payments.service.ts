import { Injectable, BadRequestException, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../database/prisma/prisma.service";
import { Resend } from "resend";

@Injectable()
export class PaymentsService {
  private resend: Resend;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.resend = new Resend(this.configService.get<string>("RESEND_API_KEY") ?? "");
  }

  async mockPayment(bookingId: number, userId: number) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException("Booking not found");
    if (booking.userId !== userId) throw new BadRequestException("Unauthorized");
    if (booking.status !== "PENDING") throw new BadRequestException("Booking is not pending");
    if (new Date() > booking.expiresAt) throw new BadRequestException("Booking has expired, please create a new booking");

    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { bookingId },
        data: { status: "PAID", paidAt: new Date() },
      }),
      this.prisma.booking.update({
        where: { id: bookingId },
        data: { status: "CONFIRMED" },
      }),
    ]);

    this.sendConfirmationEmail(bookingId).catch((err) =>
      console.error("[EMAIL ERROR]", err),
    );

    return { message: "Payment successful", bookingId };
  }

  private async sendConfirmationEmail(bookingId: number) {
    const details = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: { select: { email: true, fullName: true } },
        room: true,
        services: { include: { service: true } },
        combos: { include: { combo: true } },
      },
    });
    if (!details?.user.email) return;

    const fmt = (d: Date) =>
      d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

    const serviceList = [
      ...details.services.map((s) => `${s.service.name} x${s.quantity}`),
      ...details.combos.map((c) => `${c.combo.name} x${c.quantity}`),
    ].join(", ");

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=0f172a&data=https%3A%2F%2Fdtuvivu.vn%2Fcheckin%3Fid%3D${details.bookingCode}`;

    await this.resend.emails.send({
      from: "onboarding@resend.dev",
      to: details.user.email,
      subject: "DTUVIVU - Xác nhận đặt phòng thành công",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color:#1594D8;">DTUVIVU</h2>
          <p><strong>Phòng:</strong> ${details.room.name}</p>
          <p><strong>Mã đặt phòng:</strong> ${details.bookingCode}</p>
          <p><strong>Nhận phòng:</strong> ${fmt(details.checkInDate)}</p>
          <p><strong>Trả phòng:</strong> ${fmt(details.checkOutDate)}</p>
          ${serviceList ? `<p><strong>Dịch vụ:</strong> ${serviceList}</p>` : ""}
          <br/>
          <img src="${qrUrl}" alt="QR Check-in" style="width:180px;height:180px;"/>
          <br/><br/>
          <p style="color:#6b7280;">Cảm ơn bạn đã chọn DTUVIVU!</p>
        </div>
      `,
    });
  }

  async generateSePayQr(bookingId: number, userId: number) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true },
    });
    if (!booking) throw new NotFoundException("Booking not found");
    if (booking.userId !== userId) throw new BadRequestException("Unauthorized");
    if (booking.status !== "PENDING") throw new BadRequestException("Booking is not pending");
    if (new Date() > booking.expiresAt) throw new BadRequestException("Booking has expired, please create a new booking");

    const txnRef = `BOOKING_${booking.id}`;
    const bankAcc = this.configService.get<string>("SEPAY_BANK_ACCOUNT")!;
    const bankName = this.configService.get<string>("SEPAY_BANK_NAME")!;
    const bankHolder = this.configService.get<string>("SEPAY_BANK_HOLDER") ?? "";

    const amount = Number(booking.totalAmount);
    const qrUrl = `https://qr.sepay.vn/img?acc=${bankAcc}&bank=${bankName}&amount=${amount}&des=${txnRef}`;

    await this.prisma.payment.upsert({
      where: { bookingId },
      update: { transactionRef: txnRef, amount: booking.totalAmount, status: "PENDING" },
      create: { bookingId, amount: booking.totalAmount, transactionRef: txnRef, status: "PENDING" },
    });

    return {
      qrUrl,
      bankAccount: bankAcc,
      bankName,
      bankHolder,
      amount,
      content: txnRef,
    };
  }

  async handleSePayWebhook(headers: any, body: any) {
    const secret = this.configService.get<string>("SEPAY_WEBHOOK_SECRET");
    if (secret) {
      const authHeader = headers["authorization"] ?? "";
      const expectedAuth = `Apikey ${secret}`;
      if (authHeader !== expectedAuth) {
        throw new UnauthorizedException("Invalid webhook signature");
      }
    }

    const transactionRef = body.code ?? body.content;
    const transferAmount = body.transferAmount;
    const sepayTxnId = body.id;
    const gateway = body.gateway;

    if (!transactionRef || !transferAmount) {
      return { success: false, message: "Missing code or transferAmount" };
    }

    const payment = await this.prisma.payment.findUnique({
      where: { transactionRef },
    });

    if (!payment) {
      return { success: false, message: "Payment not found" };
    }

    if (payment.status === "PAID") {
      return { success: true, message: "Already paid" };
    }

    if (Number(transferAmount) < Number(payment.amount)) {
      return { success: false, message: "Insufficient amount" };
    }

    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "PAID",
          paidAt: new Date(),
          sepayTransactionId: sepayTxnId,
        },
      }),
      this.prisma.booking.update({
        where: { id: payment.bookingId },
        data: { status: "CONFIRMED" },
      }),
    ]);

    this.sendConfirmationEmail(payment.bookingId).catch((err) =>
      console.error("[EMAIL ERROR]", err),
    );

    return { success: true, message: "Payment confirmed" };
  }
}
