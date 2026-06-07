import { IsString, IsEnum, IsNumber, Min, IsInt, IsDateString, IsOptional } from "class-validator";

export class CreateVoucherDto {
  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(["PERCENTAGE", "FIXED_AMOUNT"])
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";

  @IsNumber()
  @Min(0)
  discountValue: number;

  @IsInt()
  @Min(1)
  maxUsage: number;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}
