# 바로 뚫림 앱별 환경변수 전략 v1

## 1. 결정 사항

바로 뚫림은 앱별로 환경변수 파일을 분리한다.

루트 `.env` 하나를 모든 앱이 공유하지 않는다. 웹, 백엔드, 향후 모바일 앱은 각자 자신의 `.env` 파일을 가진다.

개발/운영 파일은 다음 방식으로 관리한다.

- 개발 값: `.env.dev`
- 운영 값: `.env.prd`
- 실행 시 실제 로드 파일: `.env`

`pnpm env:dev`는 각 앱의 `.env.dev`를 `.env`로 복사한다. `pnpm env:prd`는 각 앱의 `.env.prd`를 `.env`로 복사한다.

## 2. 권장 구조

```txt
apps/
  web/
    .env.example
    .env
    .env.dev
    .env.prd
  server/
    .env.example
    .env
    .env.dev
    .env.prd
  mobile/
    .env.example
    .env
    .env.dev
    .env.prd
```

실제 프로젝트가 생성되면 각 앱 디렉터리 안에 `.env.example`을 함께 둔다. 실제 비밀값이 들어간 `.env`, `.env.dev`, `.env.prd`는 git에 커밋하지 않는다.

## 3. 공통 원칙

- 각 앱은 자기 실행에 필요한 환경변수만 가진다.
- public 값과 secret 값을 명확히 구분한다.
- 브라우저 또는 모바일 앱에 포함되는 값은 public 값으로 간주한다.
- Supabase service role key, DB URL, AI API key, Kakao REST API key는 백엔드 env에만 둔다.
- Next.js에서 브라우저 노출이 필요한 값은 `NEXT_PUBLIC_` 접두사를 사용한다.
- Flutter 앱에는 service role key, AI API key, DB URL을 절대 넣지 않는다.
- 배포 환경에서도 Vercel, Railway, Flutter 빌드 설정이 각각 자기 env를 관리한다.

## 4. 웹 앱 env

위치:

- `apps/web/.env.example`
- `apps/web/.env`
- `apps/web/.env.dev`
- `apps/web/.env.prd`

웹 앱에는 브라우저에서 사용 가능한 값만 둔다.

예상 변수:

```env
NEXT_PUBLIC_APP_NAME="바로 뚫림"
NEXT_PUBLIC_API_BASE_URL="http://localhost:4000"
NEXT_PUBLIC_SUPABASE_URL=""
NEXT_PUBLIC_SUPABASE_ANON_KEY=""
NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY=""
NEXT_PUBLIC_MAP_PROVIDER="kakao"
```

주의:

- `SUPABASE_SERVICE_ROLE_KEY`를 웹 env에 넣지 않는다.
- `OPENAI_API_KEY`, `GEMINI_API_KEY`, `KAKAO_REST_API_KEY`를 웹 env에 넣지 않는다.
- 고객 신고 화면에서 지도 SDK를 렌더링하기 위한 public key만 사용한다.

## 5. 백엔드 앱 env

위치:

- `apps/server/.env.example`
- `apps/server/.env`
- `apps/server/.env.dev`
- `apps/server/.env.prd`

백엔드 앱은 DB, Supabase Admin, AI, 지도 REST API, 관리자 seed 값을 관리한다.

예상 변수:

```env
NODE_ENV="development"
PORT="4000"

DATABASE_URL=""
PRISMA_SSL_REJECT_UNAUTHORIZED="false"

SUPABASE_URL=""
SUPABASE_ANON_KEY=""
SUPABASE_SERVICE_ROLE_KEY=""
SUPABASE_JWT_SECRET=""

AI_PROVIDER="openai"
OPENAI_API_KEY=""
OPENAI_MODEL=""
GEMINI_API_KEY=""
GEMINI_MODEL=""

MAP_PROVIDER="kakao"
KAKAO_REST_API_KEY=""
MAP_SEARCH_MAX_RESULTS="5"
MAP_SEARCH_CACHE_ENABLED="true"
MAP_DAILY_SOFT_LIMIT=""

ADMIN_SEED_EMAIL=""
ADMIN_SEED_PASSWORD=""
ADMIN_SEED_NAME="관리자"

CUSTOMER_LOOKUP_MODE="development_phone_only"
```

주의:

- `SUPABASE_SERVICE_ROLE_KEY`는 서버에서만 사용한다.
- Prisma seed는 `ADMIN_SEED_EMAIL`, `ADMIN_SEED_PASSWORD`, `ADMIN_SEED_NAME`을 사용한다.
- AI provider 전환은 관리자 설정과 `AI_PROVIDER` 기본값을 함께 사용한다.

## 6. 모바일 앱 env

위치:

- `apps/mobile/.env.example`
- `apps/mobile/.env`
- `apps/mobile/.env.dev`
- `apps/mobile/.env.prd`

모바일 앱은 2차 이후 Flutter로 만든다. 모바일 env에는 public config만 둔다.

예상 변수:

```env
APP_NAME="바로 뚫림"
API_BASE_URL=""
SUPABASE_URL=""
SUPABASE_ANON_KEY=""
MAP_PROVIDER="kakao"
KAKAO_NATIVE_APP_KEY=""
```

주의:

- 모바일 앱에 service role key를 넣지 않는다.
- 모바일 앱에 AI API key를 넣지 않는다.
- 모바일 앱은 항상 NestJS API를 통해 비밀 기능을 호출한다.

Flutter에서 `.env`를 사용할지는 구현 시점에 정한다. 후보는 다음과 같다.

- `flutter_dotenv`
- `--dart-define`
- `--dart-define-from-file`

## 7. 루트 env 사용 기준

루트 `.env`는 기본적으로 사용하지 않는다.

예외적으로 모노레포 툴링이 꼭 루트 env를 요구하면 다음 값만 둔다.

- 패키지 매니저 관련 값
- 로컬 개발 도구 관련 값
- 비밀이 아닌 공통 경로 값

런타임 비밀값은 각 앱 env에 둔다.

## 8. git 관리

커밋 가능:

- `.env.example`
- `.env.dev.example`
- `.env.prd.example`

커밋 금지:

- `.env`
- `.env.dev`
- `.env.prd`

실제 구현 시 `.gitignore`에서 실제 env 파일은 제외하고 example 파일만 허용한다.

## 9. 배포 환경 매핑

### Vercel

대상:

- `apps/web`

관리 변수:

- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY`

### Railway

대상:

- `apps/server`

관리 변수:

- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`
- `OPENAI_API_KEY`
- `GEMINI_API_KEY`
- `KAKAO_REST_API_KEY`
- `ADMIN_SEED_EMAIL`
- `ADMIN_SEED_PASSWORD`

### Flutter 빌드

대상:

- `apps/mobile`

관리 변수:

- `API_BASE_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `KAKAO_NATIVE_APP_KEY`

## 10. 완료 기준

프로젝트 초기 구성 시 다음 조건을 만족해야 한다.

- 웹 앱 env example이 있다.
- 백엔드 앱 env example이 있다.
- 향후 모바일 앱 env example 위치가 문서화되어 있다.
- 실제 env 파일은 git에 커밋되지 않는다.
- public key와 secret key가 분리되어 있다.
- 배포 환경별 env 입력 위치가 정리되어 있다.
