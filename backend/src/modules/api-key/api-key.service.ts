import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../database/prisma/prisma.service";

@Injectable()
export class ApiKeyService implements OnModuleInit {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) { }

  async onModuleInit() {
    await this.resetExpiredKeys();
    await this.seedFromEnv();
  }

  async getAvailableKeys() {
    await this.resetExpiredKeys();
    return this.prisma.apiKey.findMany({
      where: { status: "ACTIVE" },
    });
  }

  async markRateLimited(id: number) {
    const resetAt = new Date(Date.now() + 30 * 60 * 1000);
    await this.prisma.apiKey.update({
      where: { id },
      data: { status: "RATE_LIMITED", resetAt },
    });
  }

  async resetExpiredKeys() {
    await this.prisma.apiKey.updateMany({
      where: {
        status: "RATE_LIMITED",
        resetAt: { lte: new Date() },
      },
      data: { status: "ACTIVE", resetAt: null },
    });
  }

  private async seedFromEnv() {
    const envKeys = [
      this.configService.get<string>("GROQ_API_KEY"),
      this.configService.get<string>("GROQ_API_KEY_2"),
      this.configService.get<string>("GROQ_API_KEY_3"),
    ].filter((k): k is string => !!k);

    for (const key of envKeys) {
      const exists = await this.prisma.apiKey.findUnique({ where: { key } });
      if (!exists) {
        await this.prisma.apiKey.create({ data: { key } });
      }
    }
  }
}
