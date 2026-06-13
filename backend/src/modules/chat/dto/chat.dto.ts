import { IsString, IsInt, IsOptional } from "class-validator";

export class ChatDto {
  @IsString()
  message: string;
}

export class ConfirmBookingDto {
  @IsInt()
  roomId: number;

  @IsString()
  checkInDate: string;

  @IsString()
  checkOutDate: string;

  @IsOptional()
  @IsInt({ each: true })
  serviceIds?: number[];

  @IsOptional()
  @IsInt({ each: true })
  comboIds?: number[];
}
