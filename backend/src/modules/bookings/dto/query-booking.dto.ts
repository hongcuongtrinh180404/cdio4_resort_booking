import { IsOptional, IsString, IsInt } from "class-validator";

export class QueryBookingDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsInt()
  userId?: number;
}
