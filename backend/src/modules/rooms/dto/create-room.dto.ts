import { IsString, IsInt, IsOptional, IsNumber, Min } from "class-validator";

export class CreateRoomDto {
  @IsString()
  roomNumber: string;

  @IsString()
  name: string;

  @IsInt()
  roomTypeId: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(1)
  capacity: number;

  @IsNumber()
  @Min(0)
  pricePerNight: number;
}
