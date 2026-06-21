import { Controller, Post, Get, Param, Body, Headers, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiExcludeEndpoint } from "@nestjs/swagger";
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

  @Post("sepay/qr")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Generate SePay QR code info for booking" })
  generateSePayQr(@Body() dto: CreatePaymentUrlDto, @CurrentUser() user: JwtPayload) {
    return this.paymentsService.generateSePayQr(dto.bookingId, user.sub);
  }

  @Post("sepay/webhook")
  @ApiExcludeEndpoint()
  @ApiOperation({ summary: "SePay webhook receiver" })
  sepayWebhook(@Headers() headers: any, @Body() body: any) {
    return this.paymentsService.handleSePayWebhook(headers, body);
  }
}
