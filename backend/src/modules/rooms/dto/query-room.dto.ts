import { IsOptional, IsInt, IsDateString } from "class-validator";

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
}
