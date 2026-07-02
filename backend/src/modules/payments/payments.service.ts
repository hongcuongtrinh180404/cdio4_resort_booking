import { Injectable, BadRequestException, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../database/prisma/prisma.service";
import { BookingsService } from "../bookings/bookings.service";
import { Resend } from "resend";

@Injectable()
export class PaymentsService {
  private resend: Resend;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly bookingsService: BookingsService,
  ) {
    this.resend = new Resend(this.configService.get<string>("RESEND_API_KEY") ?? "");
  }

  async mockPayment(bookingId: number, userId: number) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException("Booking not found");
    if (booking.userId !== userId) throw new BadRequestException("Unauthorized");
    if (booking.status !== "PENDING") throw new BadRequestException("Booking is not pending");

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
        user: { select: { email: true, fullName: true, phone: true } },
        room: { include: { roomType: true } },
        services: { include: { service: true } },
        combos: { include: { combo: true } },
      },
    });
    if (!details?.user.email) return;

    const fmtDate = (d: Date) =>
      d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

    const fmtDateTime = (d: Date) => {
      const day = d.getDate().toString().padStart(2, "0");
      const month = (d.getMonth() + 1).toString().padStart(2, "0");
      const year = d.getFullYear();
      const hours = d.getHours().toString().padStart(2, "0");
      const minutes = d.getMinutes().toString().padStart(2, "0");
      return `${day}/${month}/${year} - ${hours}:${minutes}`;
    };

    const formatVND = (num: any) => {
      return Number(num).toLocaleString("vi-VN") + "₫";
    };

    const serviceRows: string[] = [];
    details.services.forEach((s) => {
      const price = Number(s.priceSnapshot);
      const formattedPrice = price === 0 ? "Miễn phí" : formatVND(price * s.quantity);
      serviceRows.push(`
        <tr style="border-bottom: 1px solid #E2E8F0;">
          <td style="padding: 10px 12px; color: #0F172A;">${s.service.name} <span style="color: #64748B; font-size: 12px;">x${s.quantity}</span></td>
          <td style="padding: 10px 12px; color: #0F172A; text-align: right; font-weight: 500;">${formattedPrice}</td>
        </tr>
      `);
    });
    details.combos.forEach((c) => {
      const price = Number(c.comboPriceSnapshot);
      const formattedPrice = price === 0 ? "Miễn phí" : formatVND(price * c.quantity);
      serviceRows.push(`
        <tr style="border-bottom: 1px solid #E2E8F0;">
          <td style="padding: 10px 12px; color: #0F172A; font-weight: 500;">${c.combo.name} <span style="color: #64748B; font-size: 12px;">x${c.quantity}</span></td>
          <td style="padding: 10px 12px; color: #0F172A; text-align: right; font-weight: 500;">${formattedPrice}</td>
        </tr>
      `);
    });
    const servicesHtml = serviceRows.join("");

    const roomTotalCost = Number(details.roomPricePerNight) * details.numberOfNights;
    const serviceTotalCost = Number(details.serviceTotal) + Number(details.comboTotal);

    const specialRequestsHtml = details.specialRequests
      ? details.specialRequests
          .split(/[\n,]/)
          .map((r) => r.trim())
          .filter(Boolean)
          .map((r) => `<li style="margin-bottom: 4px; color: #0F172A;">${r}</li>`)
          .join("")
      : '<li style="color: #64748B; font-style: italic;">Không có yêu cầu đặc biệt</li>';

    const checkInStr = `${fmtDate(details.checkInDate)} (14:00)`;
    const checkOutStr = `${fmtDate(details.checkOutDate)} (12:00)`;

    await this.resend.emails.send({
      from: "onboarding@resend.dev",
      to: details.user.email,
      subject: "DTUVIVU - Xác nhận Đặt Phòng Resort",
      html: `
        <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; background-color: #F8FAFC; padding: 40px 20px; color: #0F172A; line-height: 1.6;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 8px; border: 1px solid #E2E8F0; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
            
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 28px;">
              <h2 style="color: #1594D8; margin: 0 0 8px 0; font-family: 'Poppins', sans-serif; font-size: 26px; font-weight: 700; letter-spacing: 0.5px;">DTUVIVU RESORT</h2>
              <p style="margin: 0; font-size: 20px; font-weight: 700; color: #10B981;">🎉 Đặt phòng thành công!</p>
            </div>

            <p style="font-size: 15px; color: #334155; margin-bottom: 8px;">Xin chào <strong>${details.user.fullName}</strong>,</p>
            <p style="font-size: 15px; color: #334155; margin-top: 0; margin-bottom: 24px;">Cảm ơn bạn đã lựa chọn DTUVIVU Resort. Đơn đặt phòng của bạn đã được xác nhận thành công.</p>

            <!-- Section: Thông tin đặt phòng -->
            <div style="margin-top: 32px;">
              <h3 style="color: #1594D8; margin: 0 0 12px 0; font-size: 16px; font-weight: 600; border-bottom: 2px solid #1594D8; padding-bottom: 6px; display: inline-block;">📋 Thông tin đặt phòng</h3>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
                <tbody>
                  <tr style="border-bottom: 1px solid #E2E8F0;">
                    <td style="padding: 10px 0; color: #64748B; width: 40%;">Mã đặt phòng</td>
                    <td style="padding: 10px 0; color: #0F172A; font-weight: 600; text-align: right;">${details.bookingCode}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #E2E8F0;">
                    <td style="padding: 10px 0; color: #64748B;">Trạng thái</td>
                    <td style="padding: 10px 0; color: #10B981; font-weight: 600; text-align: right;">✅ Đã xác nhận</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #E2E8F0;">
                    <td style="padding: 10px 0; color: #64748B;">Ngày đặt</td>
                    <td style="padding: 10px 0; color: #0F172A; text-align: right;">${fmtDateTime(details.createdAt)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Section: Thông tin Resort -->
            <div style="margin-top: 24px;">
              <h3 style="color: #1594D8; margin: 0 0 12px 0; font-size: 16px; font-weight: 600; border-bottom: 2px solid #1594D8; padding-bottom: 6px; display: inline-block;">🏨 Thông tin Resort</h3>
              <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; padding: 16px; border-radius: 8px; font-size: 14px; margin-bottom: 24px;">
                <p style="margin: 0 0 8px 0; font-weight: 700; color: #0F172A; font-size: 15px;">DTUVIVU Resort</p>
                <p style="margin: 0 0 6px 0; color: #475569;">📍 <strong>Địa chỉ:</strong> 123 Võ Nguyên Giáp, Đà Nẵng</p>
                <p style="margin: 0 0 6px 0; color: #475569;">☎ <strong>Hotline:</strong> 0399391400</p>
                <p style="margin: 0; color: #475569;">✉ <strong>Email:</strong> contact@dtuvivu.vn</p>
              </div>
            </div>

            <!-- Section: Thông tin khách hàng -->
            <div style="margin-top: 24px;">
              <h3 style="color: #1594D8; margin: 0 0 12px 0; font-size: 16px; font-weight: 600; border-bottom: 2px solid #1594D8; padding-bottom: 6px; display: inline-block;">👤 Thông tin khách hàng</h3>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
                <tbody>
                  <tr style="border-bottom: 1px solid #E2E8F0;">
                    <td style="padding: 10px 0; color: #64748B; width: 40%;">Họ tên</td>
                    <td style="padding: 10px 0; color: #0F172A; font-weight: 500; text-align: right;">${details.user.fullName}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #E2E8F0;">
                    <td style="padding: 10px 0; color: #64748B;">Email</td>
                    <td style="padding: 10px 0; color: #0F172A; text-align: right;">${details.user.email}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #E2E8F0;">
                    <td style="padding: 10px 0; color: #64748B;">Số điện thoại</td>
                    <td style="padding: 10px 0; color: #0F172A; text-align: right;">${details.user.phone ?? "N/A"}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #E2E8F0;">
                    <td style="padding: 10px 0; color: #64748B;">Số khách</td>
                    <td style="padding: 10px 0; color: #0F172A; text-align: right;">${details.room.capacity} khách</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Section: Thông tin phòng -->
            <div style="margin-top: 24px;">
              <h3 style="color: #1594D8; margin: 0 0 12px 0; font-size: 16px; font-weight: 600; border-bottom: 2px solid #1594D8; padding-bottom: 6px; display: inline-block;">🛏 Thông tin phòng</h3>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px;">
                <thead>
                  <tr style="background-color: #F8FAFC; border-bottom: 1px solid #E2E8F0;">
                    <th style="text-align: left; padding: 10px; font-weight: 600; color: #475569; width: 25%;">Phòng</th>
                    <th style="text-align: left; padding: 10px; font-weight: 600; color: #475569; width: 35%;">Loại phòng</th>
                    <th style="text-align: center; padding: 10px; font-weight: 600; color: #475569; width: 15%;">Số lượng</th>
                    <th style="text-align: right; padding: 10px; font-weight: 600; color: #475569; width: 25%;">Giá / Đêm</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style="border-bottom: 1px solid #E2E8F0;">
                    <td style="padding: 12px 10px; color: #0F172A; font-weight: 500;">${details.room.roomNumber}</td>
                    <td style="padding: 12px 10px; color: #475569;">${details.room.roomType.name}</td>
                    <td style="padding: 12px 10px; color: #0F172A; text-align: center;">1</td>
                    <td style="padding: 12px 10px; color: #0F172A; font-weight: 600; text-align: right;">${formatVND(details.roomPricePerNight)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Section: Thời gian lưu trú -->
            <div style="margin-top: 24px;">
              <h3 style="color: #1594D8; margin: 0 0 12px 0; font-size: 16px; font-weight: 600; border-bottom: 2px solid #1594D8; padding-bottom: 6px; display: inline-block;">📅 Thời gian lưu trú</h3>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
                <tbody>
                  <tr style="border-bottom: 1px solid #E2E8F0;">
                    <td style="padding: 10px 0; color: #64748B; width: 40%;">Check-in</td>
                    <td style="padding: 10px 0; color: #0F172A; font-weight: 500; text-align: right;">${checkInStr}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #E2E8F0;">
                    <td style="padding: 10px 0; color: #64748B;">Check-out</td>
                    <td style="padding: 10px 0; color: #0F172A; font-weight: 500; text-align: right;">${checkOutStr}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #E2E8F0;">
                    <td style="padding: 10px 0; color: #64748B;">Số đêm</td>
                    <td style="padding: 10px 0; color: #0F172A; font-weight: 600; text-align: right;">${details.numberOfNights}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Section: Dịch vụ đi kèm -->
            <div style="margin-top: 24px;">
              <h3 style="color: #1594D8; margin: 0 0 12px 0; font-size: 16px; font-weight: 600; border-bottom: 2px solid #1594D8; padding-bottom: 6px; display: inline-block;">🎁 Dịch vụ đi kèm</h3>
              ${
                servicesHtml
                  ? `
                  <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px;">
                    <thead>
                      <tr style="background-color: #F8FAFC; border-bottom: 1px solid #E2E8F0;">
                        <th style="text-align: left; padding: 10px 12px; font-weight: 600; color: #475569;">Dịch vụ</th>
                        <th style="text-align: right; padding: 10px 12px; font-weight: 600; color: #475569;">Giá</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${servicesHtml}
                    </tbody>
                  </table>
                  `
                  : `<p style="font-size: 14px; color: #64748B; font-style: italic; margin-bottom: 24px; margin-top: 4px;">Không đăng ký dịch vụ đi kèm</p>`
              }
            </div>

            <!-- Section: Chi tiết thanh toán -->
            <div style="margin-top: 24px;">
              <h3 style="color: #1594D8; margin: 0 0 12px 0; font-size: 16px; font-weight: 600; border-bottom: 2px solid #1594D8; padding-bottom: 6px; display: inline-block;">💰 Chi tiết thanh toán</h3>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
                <tbody>
                  <tr style="border-bottom: 1px solid #E2E8F0;">
                    <td style="padding: 10px 0; color: #64748B; width: 45%;">Tiền phòng</td>
                    <td style="padding: 10px 0; color: #0F172A; text-align: right; font-weight: 500;">${formatVND(roomTotalCost)}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #E2E8F0;">
                    <td style="padding: 10px 0; color: #64748B;">Dịch vụ</td>
                    <td style="padding: 10px 0; color: #0F172A; text-align: right; font-weight: 500;">${formatVND(serviceTotalCost)}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #E2E8F0;">
                    <td style="padding: 10px 0; color: #64748B;">Thuế VAT</td>
                    <td style="padding: 10px 0; color: #64748B; text-align: right; font-style: italic;">Đã bao gồm trong giá</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #E2E8F0;">
                    <td style="padding: 10px 0; color: #64748B;">Giảm giá</td>
                    <td style="padding: 10px 0; color: #EF4444; text-align: right; font-weight: 500;">-0₫</td>
                  </tr>
                  <tr style="background-color: #F8FAFC; border-top: 2px solid #E2E8F0;">
                    <td style="padding: 12px 10px; color: #0F172A; font-weight: 700; font-size: 15px;">Tổng thanh toán</td>
                    <td style="padding: 12px 10px; color: #1594D8; text-align: right; font-weight: 700; font-size: 17px;">${formatVND(details.totalAmount)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Section: Yêu cầu đặc biệt -->
            <div style="margin-top: 24px;">
              <h3 style="color: #1594D8; margin: 0 0 12px 0; font-size: 16px; font-weight: 600; border-bottom: 2px solid #1594D8; padding-bottom: 6px; display: inline-block;">📝 Yêu cầu đặc biệt</h3>
              <ul style="margin: 4px 0 24px 0; padding-left: 20px; font-size: 14px;">
                ${specialRequestsHtml}
              </ul>
            </div>

            <!-- Section: Chính sách -->
            <div style="margin-top: 24px; border-top: 1px solid #E2E8F0; padding-top: 20px;">
              <h3 style="color: #64748B; margin: 0 0 10px 0; font-size: 15px; font-weight: 600;">📌 Chính sách và Lưu ý</h3>
              <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #475569;">
                <li style="margin-bottom: 4px;">Thời gian nhận phòng (Check-in) từ <strong>14:00</strong>.</li>
                <li style="margin-bottom: 4px;">Thời gian trả phòng (Check-out) trước <strong>12:00</strong>.</li>
                <li style="margin-bottom: 4px;">Hủy đặt phòng miễn phí trước 24 giờ kể từ thời điểm nhận phòng.</li>
                <li>Sau thời gian trên sẽ tính phí theo chính sách của resort.</li>
              </ul>
            </div>

          </div>
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
    if (booking.status !== "PENDING" && booking.status !== "PENDING_CHECKOUT") throw new BadRequestException("Booking is not pending");

    const txnRef = `BOOKING_${booking.id}`;
    const bankAcc = this.configService.get<string>("SEPAY_BANK_ACCOUNT")!;
    const bankName = this.configService.get<string>("SEPAY_BANK_NAME")!;
    const bankHolder = this.configService.get<string>("SEPAY_BANK_HOLDER") ?? "";

    const amount = Number(booking.totalAmount);
    const qrAmount = Math.floor(amount / 1000);
    const qrUrl = `https://qr.sepay.vn/img?acc=${bankAcc}&bank=${bankName}&amount=${qrAmount}&des=${txnRef}`;

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

  async startCheckout(bookingId: number, userId: number) {
    await this.bookingsService.lockForCheckout(bookingId, userId);
    return this.generateSePayQr(bookingId, userId);
  }

  async cancelCheckout(bookingId: number, userId: number) {
    await this.bookingsService.cancelCheckout(bookingId, userId);
    return { message: "Checkout cancelled", bookingId };
  }

  async handleSePayWebhook(headers: any, body: any) {
    console.log("[SEPAY WEBHOOK] Received:", JSON.stringify(body));

    const secret = this.configService.get<string>("SEPAY_WEBHOOK_SECRET");
    if (secret) {
      const authHeader = headers["authorization"] ?? "";
      const expectedAuth = `Apikey ${secret}`;
      if (authHeader !== expectedAuth) {
        console.warn("[SEPAY WEBHOOK] Invalid signature");
        throw new UnauthorizedException("Invalid webhook signature");
      }
    }

    const transactionRef = (body.code || body.content || "").trim();
    const transferAmount = body.transferAmount;
    const sepayTxnId = body.id;
    const gateway = body.gateway;

    console.log("[SEPAY WEBHOOK] Parsed:", { transactionRef, transferAmount, sepayTxnId, gateway });

    if (!transactionRef || !transferAmount) {
      console.warn("[SEPAY WEBHOOK] Missing code or transferAmount");
      return { success: false, message: "Missing code or transferAmount" };
    }

    let payment = await this.prisma.payment.findUnique({
      where: { transactionRef },
    });

    if (!payment) {
      console.warn(`[SEPAY WEBHOOK] Payment not found for transactionRef: ${transactionRef}, trying fallback...`);
      const match = transactionRef.match(/BOOKING[_\s]*(\d+)/i);
      if (match) {
        payment = await this.prisma.payment.findFirst({
          where: { bookingId: parseInt(match[1], 10) },
        });
      }
    }

    if (!payment) {
      console.warn(`[SEPAY WEBHOOK] Payment not found after fallback`);
      return { success: false, message: "Payment not found" };
    }

    console.log(`[SEPAY WEBHOOK] Found payment: id=${payment.id}, bookingId=${payment.bookingId}, amount=${payment.amount}, status=${payment.status}, transactionRef=${payment.transactionRef}`);

    if (payment.status === "PAID") {
      console.log(`[SEPAY WEBHOOK] Payment ${payment.id} already paid`);
      return { success: true, message: "Already paid" };
    }

    const expectedAmount = Math.floor(Number(payment.amount) / 1000);
    if (Number(transferAmount) < expectedAmount) {
      console.warn(`[SEPAY WEBHOOK] Insufficient amount: transferAmount=${transferAmount}, expected=${expectedAmount}`);
      return { success: false, message: "Insufficient amount" };
    }

    console.log(`[SEPAY WEBHOOK] Amount OK: ${transferAmount} >= ${expectedAmount}, confirming payment...`);

    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "PAID",
          paidAt: new Date(),
          sepayTransactionId: String(sepayTxnId),
        },
      }),
      this.prisma.booking.update({
        where: { id: payment.bookingId },
        data: { status: "CONFIRMED" },
      }),
    ]);

    console.log(`[SEPAY WEBHOOK] Payment ${payment.id} confirmed, booking ${payment.bookingId} -> CONFIRMED`);

    this.sendConfirmationEmail(payment.bookingId).catch((err) =>
      console.error("[EMAIL ERROR]", err),
    );

    return { success: true, message: "Payment confirmed" };
  }
}
