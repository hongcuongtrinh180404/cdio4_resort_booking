import { IsInt } from "class-validator";

export class CreatePaymentUrlDto {
  @IsInt()
  bookingId: number;
}
