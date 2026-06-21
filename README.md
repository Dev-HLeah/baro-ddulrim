# 바로 뚫림

배수 문제 신고를 접수하고, AI 분석과 관리자 검수를 거쳐 지역별 업체 입찰/배정을 진행하는 중계 플랫폼입니다.

## 기술 스택

- 프론트엔드: Next.js
- 백엔드: NestJS
- ORM: Prisma
- DB/Storage/Auth: Supabase
- 패키지 매니저: pnpm

## 앱 구조

```txt
apps/
  web/      # 고객/관리자 웹 (3000)
  partner/  # 업체 웹 (3001)
  server/   # NestJS API (4000)
  mobile/   # 향후 Flutter 앱
docs/       # 기획/설계 문서
```

## 개발 명령

```bash
pnpm install
pnpm dev:web
pnpm dev:partner
pnpm dev:server
pnpm build
pnpm typecheck
```

## 환경변수

앱별 env 파일을 사용합니다.

- `apps/web/.env.example`
- `apps/web/.env.dev`
- `apps/web/.env.prd`
- `apps/partner/.env.example`
- `apps/partner/.env.dev`
- `apps/partner/.env.prd`
- `apps/server/.env.example`
- `apps/server/.env.dev`
- `apps/server/.env.prd`
- `apps/mobile/.env.example`
- `apps/mobile/.env.dev`
- `apps/mobile/.env.prd`

실제 `.env`, `.env.dev`, `.env.prd` 파일은 git에 커밋하지 않습니다.

개발 실행 전에는 `pnpm env:dev`가 각 앱의 `.env.dev`를 `.env`로 복사합니다. 운영 빌드용 로컬 환경을 맞출 때는 `pnpm env:prd` 또는 `pnpm build:prd`를 사용합니다.
