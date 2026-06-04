import "dotenv/config";
import { defineConfig } from "prisma/config";

const fallbackDatabaseUrl = "postgresql://postgres:postgres@localhost:5432/baro_ddulrim";

function resolveCliDatabaseUrl() {
  const rawUrl = process.env.DIRECT_URL || process.env.DATABASE_URL || fallbackDatabaseUrl;
  const url = new URL(rawUrl);

  if (url.hostname.includes("supabase.com") && !url.searchParams.has("sslmode")) {
    url.searchParams.set("sslmode", "require");
  }

  return url.toString();
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts"
  },
  datasource: {
    url: resolveCliDatabaseUrl()
  }
});
