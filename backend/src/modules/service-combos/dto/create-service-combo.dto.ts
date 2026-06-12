import { IsString, IsNumber, Min, IsArray, IsInt, IsOptional, IsBoolean } from "class-validator";

export class CreateServiceComboDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  comboPrice: number;

  @IsOptional()
  @IsArray()
  imageUrls?: string[];

  @IsArray()
  @IsInt({ each: true })
  serviceIds: number[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
