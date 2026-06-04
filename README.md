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
  web/      # 고객/관리자/업체 웹
  server/   # NestJS API
  mobile/   # 향후 Flutter 앱
docs/       # 기획/설계 문서
```

## 개발 명령

```bash
pnpm install
pnpm dev:web
pnpm dev:server
pnpm build
pnpm typecheck
```

## 환경변수

앱별 env 파일을 사용합니다.

- `apps/web/.env.example`
- `apps/server/.env.example`
- `apps/mobile/.env.example`

실제 `.env` 파일은 git에 커밋하지 않습니다.
