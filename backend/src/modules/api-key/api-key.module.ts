import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../database/database.module";
import { ApiKeyService } from "./api-key.service";

@Module({
  imports: [DatabaseModule],
  providers: [ApiKeyService],
  exports: [ApiKeyService],
})
export class ApiKeyModule {}
