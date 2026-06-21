import { copyFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const mode = process.argv[2];
const validModes = new Set(["dev", "prd"]);

if (!validModes.has(mode)) {
  console.error("사용법: node scripts/sync-env.mjs <dev|prd>");
  process.exit(1);
}

const appDirs = ["apps/web", "apps/partner", "apps/server"];
let copiedCount = 0;
const missing = [];

for (const appDir of appDirs) {
  const source = join(appDir, `.env.${mode}`);
  const target = join(appDir, ".env");

  if (!existsSync(appDir)) {
    continue;
  }

  if (!existsSync(source)) {
    missing.push(source);
    continue;
  }

  copyFileSync(source, target);
  copiedCount += 1;
  console.log(`${source} -> ${target}`);
}

if (missing.length > 0) {
  console.error(`누락된 env 파일: ${missing.join(", ")}`);
  console.error("각 앱의 .env.dev 또는 .env.prd 파일을 만든 뒤 다시 실행하세요.");
  process.exit(1);
}

if (copiedCount === 0) {
  console.error("복사된 env 파일이 없습니다.");
  process.exit(1);
}
