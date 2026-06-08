import { Type } from "class-transformer";
import { IsOptional, IsInt, IsDateString, IsString, IsNumber, Min } from "class-validator";

export class QueryRoomDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  roomTypeId?: number;

  @IsOptional()
  @Type(() => Number)
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
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;
}
