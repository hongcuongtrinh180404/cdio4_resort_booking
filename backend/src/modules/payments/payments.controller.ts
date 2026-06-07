import { Controller, Post, Get, Param, Body, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { PaymentsService } from "./payments.service";
import { CreatePaymentUrlDto } from "./dto/create-payment-url.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtPayload } from "../auth/strategies/jwt.strategy";

@ApiTags("payments")
@Controller("payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post("mock")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Mock payment — instantly confirms booking" })
  mockPayment(@Body() dto: CreatePaymentUrlDto, @CurrentUser() user: JwtPayload) {
    return this.paymentsService.mockPayment(dto.bookingId, user.sub);
  }

  @Post("create-url")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Create VNPay payment URL" })
  createPaymentUrl(@Body() dto: CreatePaymentUrlDto, @CurrentUser() user: JwtPayload) {
    return this.paymentsService.createPaymentUrl(dto.bookingId, user.sub);
  }

  @Get("vnpay-return")
  @ApiOperation({ summary: "VNPay return URL (UI display only)" })
  vnpayReturn(@Query() query: any) {
    return this.paymentsService.handleReturn(query);
  }

  @Post("vnpay-ipn")
  @ApiOperation({ summary: "VNPay IPN webhook" })
  vnpayIpn(@Body() body: any) {
    return this.paymentsService.handleIpn(body);
  }
}
