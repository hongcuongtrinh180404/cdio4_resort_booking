import { Module } from "@nestjs/common";
import { ServiceCombosController } from "./service-combos.controller";
import { ServiceCombosService } from "./service-combos.service";
import { ServicesModule } from "../services/services.module";

@Module({
  imports: [ServicesModule],
  controllers: [ServiceCombosController],
  providers: [ServiceCombosService],
  exports: [ServiceCombosService],
})
export class ServiceCombosModule {}
