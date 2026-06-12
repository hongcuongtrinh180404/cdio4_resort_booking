import { IsString, IsOptional, IsInt } from "class-validator";

export class AddRoomImageDto {
  @IsString()
  imageUrl: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
