import { IsString, IsIn } from "class-validator";

export class UpdateRoomStatusDto {
  @IsString()
  @IsIn(["AVAILABLE", "OCCUPIED", "MAINTENANCE", "INACTIVE"])
  status: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE" | "INACTIVE";
}
