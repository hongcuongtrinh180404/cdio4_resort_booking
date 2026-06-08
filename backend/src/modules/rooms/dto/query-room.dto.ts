import { IsOptional, IsInt, IsDateString, IsString } from "class-validator";

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
}
