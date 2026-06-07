import { IsString, IsNumber, Min, IsArray, IsInt, IsOptional } from "class-validator";

export class CreateServiceComboDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  comboPrice: number;

  @IsArray()
  @IsInt({ each: true })
  serviceIds: number[];
}
