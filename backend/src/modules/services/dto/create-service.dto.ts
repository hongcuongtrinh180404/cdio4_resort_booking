import { IsString, IsNumber, Min, IsOptional, IsArray } from "class-validator";

export class CreateServiceDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsArray()
  imageUrls?: string[];
}
