import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../database/prisma/prisma.service";

@Injectable()
export class ApiKeyService implements OnModuleInit {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.resetExpiredKeys();
    await this.seedFromEnv();
  }

  async getAvailableKeys(provider: string) {
    await this.resetExpiredKeys();
    return this.prisma.apiKey.findMany({
      where: { provider, status: "ACTIVE" },
    });
  }

  async markRateLimited(id: number) {
    const resetAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await this.prisma.apiKey.update({
      where: { id },
      data: {
        status: "RATE_LIMITED",
        rateLimitedAt: new Date(),
        resetAt,
      },
    });
  }

  async resetExpiredKeys() {
    await this.prisma.apiKey.updateMany({
      where: {
        status: "RATE_LIMITED",
        resetAt: { lte: new Date() },
      },
      data: {
        status: "ACTIVE",
        rateLimitedAt: null,
        resetAt: null,
      },
    });
  }

  private async seedFromEnv() {
    const envKeys = [
      { key: this.configService.get<string>("GROQ_API_KEY"), label: "main" },
      { key: this.configService.get<string>("GROQ_API_KEY_2"), label: "backup 1" },
      { key: this.configService.get<string>("GROQ_API_KEY_3"), label: "backup 2" },
    ].filter((k): k is { key: string; label: string } => !!k.key);

    for (const { key, label } of envKeys) {
      const exists = await this.prisma.apiKey.findUnique({ where: { key } });
      if (!exists) {
        await this.prisma.apiKey.create({
          data: { provider: "groq", key, label },
        });
      }
    }
  }
}
