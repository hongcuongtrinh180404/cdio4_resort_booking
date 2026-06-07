import { Module } from "@nestjs/common";
import { BookingsController } from "./bookings.controller";
import { BookingsService } from "./bookings.service";
import { RoomsModule } from "../rooms/rooms.module";
import { ServicesModule } from "../services/services.module";
import { ServiceCombosModule } from "../service-combos/service-combos.module";
import { VouchersModule } from "../vouchers/vouchers.module";

@Module({
  imports: [RoomsModule, ServicesModule, ServiceCombosModule, VouchersModule],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
