import { IsEmail, IsString, MinLength, IsOptional, Matches } from "class-validator";

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  fullName: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d+$/, { message: "Số điện thoại chỉ được chứa số (0-9)" })
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;
}
