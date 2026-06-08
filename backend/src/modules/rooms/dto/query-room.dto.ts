import { IsOptional, IsInt, IsDateString, IsString, IsNumber, Min } from "class-validator";

export class QueryRoomDto {
  @IsOptional()
  @IsInt()
  roomTypeId?: number;

  @IsOptional()
  @IsInt()
  capacity?: number;

  @IsOptional()
  @IsDateString()
  checkIn?: string;

  @IsOptional()
  @IsDateString()
  checkOut?: string;

  @IsOptional()
  @IsString()
  amenityIds?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPrice?: number;
}
