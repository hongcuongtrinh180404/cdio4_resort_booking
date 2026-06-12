import { IsString, IsIn } from "class-validator";

export class UpdateBookingStatusDto {
  @IsString()
  @IsIn(["CHECKED_IN", "CHECKED_OUT"])
  status: "CHECKED_IN" | "CHECKED_OUT";
}
