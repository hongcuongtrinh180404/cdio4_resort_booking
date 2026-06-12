import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { DatabaseModule } from "../../database/database.module";
import { ChatController } from "./chat.controller";
import { ChatService } from "./chat.service";
import { ChatGateway } from "./chat.gateway";
import { RoomsModule } from "../rooms/rooms.module";
import { ServicesModule } from "../services/services.module";
import { ServiceCombosModule } from "../service-combos/service-combos.module";
import { BookingsModule } from "../bookings/bookings.module";

@Module({
  imports: [
    DatabaseModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>("JWT_SECRET") ?? "secret",
        signOptions: { expiresIn: configService.get<string>("JWT_EXPIRES_IN") ?? "7d" },
      }),
    }),
    RoomsModule,
    ServicesModule,
    ServiceCombosModule,
    BookingsModule,
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
  exports: [ChatService, ChatGateway],
})
export class ChatModule {}
