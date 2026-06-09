import { IsInt, IsDateString, IsArray, IsOptional, IsString, IsEnum, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

class ServiceItem {
  @IsInt()
  serviceId: number;

  @IsInt()
  quantity: number;
}

class ComboItem {
  @IsInt()
  comboId: number;

  @IsInt()
  quantity: number;
}

export class CreateBookingDto {
  @IsInt()
  roomId: number;

  @IsDateString()
  checkInDate: string;

  @IsDateString()
  checkOutDate: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceItem)
  services?: ServiceItem[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ComboItem)
  combos?: ComboItem[];

  @IsOptional()
  @IsString()
  paymentMethod?: "VNPAY" | "VISA";
}
