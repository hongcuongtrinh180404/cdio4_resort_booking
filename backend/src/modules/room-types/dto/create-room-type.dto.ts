import { IsString, IsOptional } from "class-validator";

export class CreateRoomTypeDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}
