import { IsString, IsOptional, Matches } from "class-validator";

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d+$/, { message: "Số điện thoại chỉ được chứa số (0-9)" })
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;
}
