import { IsInt, IsDateString, IsArray, IsOptional, IsString } from "class-validator";

export class CreateBookingDto {
  @IsInt()
  roomId: number;

  @IsDateString()
  checkInDate: string;

  @IsDateString()
  checkOutDate: string;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  serviceIds?: number[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  comboIds?: number[];

  @IsOptional()
  @IsString()
  voucherCode?: string;
}
