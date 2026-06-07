import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../database/prisma/prisma.service";
import * as crypto from "crypto";

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async mockPayment(bookingId: number, userId: number) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException("Booking not found");
    if (booking.userId !== userId) throw new BadRequestException("Unauthorized");
    if (booking.status !== "PENDING") throw new BadRequestException("Booking is not pending");

    await this.prisma.$transaction([
      this.prisma.payment.create({
        data: {
          bookingId,
          amount: booking.totalAmount,
          transactionRef: `MOCK_${bookingId}_${Date.now()}`,
          status: "SUCCESS",
          paidAt: new Date(),
          vnpayResponseCode: "00",
        },
      }),
      this.prisma.booking.update({
        where: { id: bookingId },
        data: { status: "CONFIRMED" },
      }),
    ]);

    return { message: "Payment successful", bookingId };
  }

  async createPaymentUrl(bookingId: number, userId: number) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException("Booking not found");
    if (booking.userId !== userId) throw new BadRequestException("Unauthorized");
    if (booking.status !== "PENDING") throw new BadRequestException("Booking is not pending");

    const tmnCode = this.configService.get<string>("VNPAY_TMN_CODE")!;
    const hashSecret = this.configService.get<string>("VNPAY_HASH_SECRET")!;
    const vnpayUrl = this.configService.get<string>("VNPAY_URL")!;
    const returnUrl = this.configService.get<string>("VNPAY_RETURN_URL")!;
    const ipnUrl = this.configService.get<string>("VNPAY_IPN_URL")!;

    const txnRef = `BK${bookingId}_${Date.now()}`;
    const date = new Date();
    const createDate = date.toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
    const orderId = booking.bookingCode;

    const params: Record<string, string> = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: tmnCode,
      vnp_Amount: String(Math.round(Number(booking.totalAmount) * 100)),
      vnp_CreateDate: createDate,
      vnp_CurrCode: "VND",
      vnp_IpAddr: "127.0.0.1",
      vnp_Locale: "vn",
      vnp_OrderInfo: `Thanh toan booking ${orderId}`,
      vnp_OrderType: "other",
      vnp_ReturnUrl: returnUrl,
      vnp_TxnRef: txnRef,
    };

    if (ipnUrl) params["vnp_IpnUrl"] = ipnUrl;

    const sortedKeys = Object.keys(params).sort();
    const signData = sortedKeys.map((key) => `${key}=${params[key]}`).join("&");
    const secureHash = crypto.createHmac("sha512", hashSecret).update(signData).digest("hex");
    params["vnp_SecureHash"] = secureHash;

    const paymentUrl = `${vnpayUrl}?${new URLSearchParams(params).toString()}`;

    await this.prisma.payment.upsert({
      where: { bookingId },
      update: { transactionRef: txnRef, amount: booking.totalAmount, status: "PENDING" },
      create: { bookingId, amount: booking.totalAmount, transactionRef: txnRef },
    });

    return { paymentUrl };
  }

  async handleIpn(body: any) {
    const hashSecret = this.configService.get<string>("VNPAY_HASH_SECRET")!;
    const secureHash = body["vnp_SecureHash"];
    delete body["vnp_SecureHash"];
    delete body["vnp_SecureHashType"];

    const sortedKeys = Object.keys(body).sort();
    const signData = sortedKeys.map((key) => `${key}=${body[key]}`).join("&");
    const computedHash = crypto.createHmac("sha512", hashSecret).update(signData).digest("hex");

    if (secureHash !== computedHash) {
      return { RspCode: "97", Message: "Invalid signature" };
    }

    const txnRef = body["vnp_TxnRef"];
    const responseCode = body["vnp_ResponseCode"];

    const payment = await this.prisma.payment.findUnique({ where: { transactionRef: txnRef } });
    if (!payment) {
      return { RspCode: "01", Message: "Order not found" };
    }
    if (payment.status === "SUCCESS") {
      return { RspCode: "00", Message: "Confirm Success" };
    }

    if (responseCode === "00") {
      await this.prisma.$transaction([
        this.prisma.payment.update({
          where: { id: payment.id },
          data: { status: "SUCCESS", vnpayResponseCode: responseCode, paidAt: new Date() },
        }),
        this.prisma.booking.update({
          where: { id: payment.bookingId },
          data: { status: "CONFIRMED" },
        }),
      ]);
      return { RspCode: "00", Message: "Confirm Success" };
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED", vnpayResponseCode: responseCode },
    });
    return { RspCode: "00", Message: "Confirm Success" };
  }

  async handleReturn(query: any) {
    const hashSecret = this.configService.get<string>("VNPAY_HASH_SECRET")!;
    const secureHash = query["vnp_SecureHash"];
    delete query["vnp_SecureHash"];
    delete query["vnp_SecureHashType"];

    const sortedKeys = Object.keys(query).sort();
    const signData = sortedKeys.map((key) => `${key}=${query[key]}`).join("&");
    const computedHash = crypto.createHmac("sha512", hashSecret).update(signData).digest("hex");

    const isValid = secureHash === computedHash;
    return { isValid, responseCode: query["vnp_ResponseCode"], message: "For UI display only" };
  }
}
