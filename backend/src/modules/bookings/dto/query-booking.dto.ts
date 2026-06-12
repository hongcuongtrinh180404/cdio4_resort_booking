import { IsOptional, IsString, IsInt, IsDateString } from "class-validator";
import { Type } from "class-transformer";
import { PaginationDto } from "../../../common/dto/pagination.dto";

export class QueryBookingDto extends PaginationDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  userId?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsDateString()
  checkInFrom?: string;

  @IsOptional()
  @IsDateString()
  checkInTo?: string;

  @IsOptional()
  @IsDateString()
  checkOutFrom?: string;

  @IsOptional()
  @IsDateString()
  checkOutTo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  roomTypeId?: number;
}
