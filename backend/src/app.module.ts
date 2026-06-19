import { Module } from "@nestjs/common";
import { ConfigModule } from "./config/config.module";
import { DatabaseModule } from "./database/database.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { RoomsModule } from "./modules/rooms/rooms.module";
import { RoomTypesModule } from "./modules/room-types/room-types.module";
import { ServicesModule } from "./modules/services/services.module";
import { ServiceCombosModule } from "./modules/service-combos/service-combos.module";
import { BookingsModule } from "./modules/bookings/bookings.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { WishlistModule } from "./modules/wishlist/wishlist.module";
import { AdminModule } from "./modules/admin/admin.module";
import { ChatModule } from "./modules/chat/chat.module";
import { AdminChatModule } from "./modules/admin-chat/admin-chat.module";
import { ApiKeyModule } from "./modules/api-key/api-key.module";

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    AuthModule,
    UsersModule,
    RoomsModule,
    RoomTypesModule,
    ServicesModule,
    ServiceCombosModule,
    BookingsModule,
    PaymentsModule,
    WishlistModule,
    AdminModule,
    ChatModule,
    AdminChatModule,
    ApiKeyModule,
  ],
})
export class AppModule {}
