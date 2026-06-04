import { PrismaPg } from "@prisma/adapter-pg";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "../src/generated/prisma/client";

const fallbackDatabaseUrl = "postgresql://postgres:postgres@localhost:5432/baro_ddulrim";

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL ?? fallbackDatabaseUrl;
  const rejectUnauthorized = process.env.PRISMA_SSL_REJECT_UNAUTHORIZED !== "false";

  return new PrismaClient({
    adapter: new PrismaPg({
      connectionString,
      ssl: {
        rejectUnauthorized
      }
    })
  });
}

const prisma = createPrismaClient();

async function seedAdmin() {
  const email = process.env.ADMIN_SEED_EMAIL;
  const password = process.env.ADMIN_SEED_PASSWORD;
  const name = process.env.ADMIN_SEED_NAME || "관리자";
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!email || !password || !supabaseUrl || !serviceRoleKey) {
    console.warn("관리자 seed 환경변수가 부족해 관리자 계정 생성을 건너뜁니다.");
    return;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      name,
      role: "admin"
    }
  });

  if (error && !error.message.toLowerCase().includes("already")) {
    throw error;
  }

  const authUserId = data.user?.id;

  await prisma.adminUser.upsert({
    where: { email },
    update: {
      authUserId,
      name,
      isActive: true
    },
    create: {
      authUserId,
      email,
      name,
      isActive: true
    }
  });
}

async function seedSettings() {
  await prisma.appSetting.upsert({
    where: { key: "ai_provider" },
    update: {},
    create: {
      key: "ai_provider",
      value: process.env.AI_PROVIDER || "openai"
    }
  });

  await prisma.appSetting.upsert({
    where: { key: "customer_lookup_mode" },
    update: {},
    create: {
      key: "customer_lookup_mode",
      value: process.env.CUSTOMER_LOOKUP_MODE || "development_phone_only"
    }
  });

  await prisma.appSetting.upsert({
    where: { key: "map_provider" },
    update: {},
    create: {
      key: "map_provider",
      value: process.env.MAP_PROVIDER || "kakao"
    }
  });
}

async function main() {
  await seedSettings();
  await seedAdmin();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
