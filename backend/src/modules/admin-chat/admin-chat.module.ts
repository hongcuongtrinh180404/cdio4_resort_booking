import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../database/database.module";
import { ChatModule } from "../chat/chat.module";
import { AdminChatController } from "./admin-chat.controller";
import { AdminChatService } from "./admin-chat.service";

@Module({
  imports: [DatabaseModule, ChatModule],
  controllers: [AdminChatController],
  providers: [AdminChatService],
})
export class AdminChatModule {}
