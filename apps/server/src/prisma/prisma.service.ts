import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const fallbackDatabaseUrl = "postgresql://postgres:postgres@localhost:5432/baro_ddulrim";

function createPrismaAdapter() {
  const connectionString = process.env.DATABASE_URL ?? fallbackDatabaseUrl;
  const rejectUnauthorized = process.env.PRISMA_SSL_REJECT_UNAUTHORIZED !== "false";

  return new PrismaPg({
    connectionString,
    ssl: {
      rejectUnauthorized
    }
  });
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor() {
    super({
      adapter: createPrismaAdapter()
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
