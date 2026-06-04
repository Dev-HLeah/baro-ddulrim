# 바로 뚫림 1차 MVP 개발 계획서

## 1. 서비스 목표

바로 뚫림은 배수로, 하수구, 역류, 침수, 악취 등 배수 문제 신고를 접수하고, AI가 상담 내용을 구조화한 뒤, 관리자가 검수하여 지역별 제휴 업체 입찰과 배정을 진행하는 중계 플랫폼이다.

고객의 핵심 불안은 다음과 같다.

- 어떤 업체가 잘하는지 알기 어렵다.
- 불필요한 비용 청구가 걱정된다.
- 막힘, 역류, 침수 상황에서 빠르게 대응할 업체를 찾기 어렵다.
- 상담 내용과 견적, 배정, 처리 과정이 기록으로 남지 않는다.

1차 MVP의 목표는 고객 신고부터 관리자 검수, 업체 입찰, 업체 배정, 처리 완료 기록, 지도/대시보드 확인까지 웹 기반으로 운영 가능한 흐름을 만드는 것이다.

## 2. 1차 MVP 범위

### 포함

- 고객 신고 웹
- 웹형 채팅 신고 접수
- 고객 신고 조회 화면
- 관리자 웹
- 업체 웹
- 업체 회원가입/로그인
- 업체 등록 및 관리자 승인
- AI 신고 분석
- 관리자 신고 확인/수정/승인
- 지역 기반 업체 입찰 공개
- 업체 입찰
- 관리자 업체 배정
- 고객 안내 메시지 템플릿 관리
- 업체 작업 진행 기록
- 지도 기반 신고/처리 현황
- 관리자 대시보드 통계
- 모든 상담/수정/승인/입찰/배정/처리 기록 저장

### 제외

- 네이티브 고객 앱
- 네이티브 업체 앱
- SMS 자동 발송
- 카카오톡 자동 발송
- AI 전화 접수
- 고객 결제
- 업체 정산
- 플랫폼 수수료
- 업체 월 가입비/멤버십 과금
- 기능별 자동 테스트 코드 작성

2차 이후에는 SMS, 카카오톡, AI 전화, 네이티브 앱, 업체 월 가입비 BM을 확장할 수 있도록 데이터 구조만 준비한다.

## 2-1. 기술 스택

### 백엔드

- NestJS
- Prisma
- Supabase PostgreSQL

백엔드는 NestJS 모듈 단위로 도메인을 나누고, Prisma를 통해 Supabase PostgreSQL과 연결한다.

권장 백엔드 모듈:

- `auth`
- `customers`
- `reports`
- `ai`
- `contractors`
- `bids`
- `assignments`
- `messages`
- `templates`
- `maps`
- `dashboard`
- `settings`
- `files`

### 프론트엔드

- Next.js
- React 기반 컴포넌트 구조

프론트엔드는 고객 웹, 관리자 웹, 업체 웹, 지도 현황 웹을 Next.js 안에서 역할별 라우트로 구성한다.

권장 라우트 구조:

- `/`
- `/report/new`
- `/report/list`
- `/report/[reportNo]`
- `/admin`
- `/admin/reports`
- `/admin/contractors`
- `/admin/bids`
- `/admin/templates`
- `/admin/map`
- `/admin/settings`
- `/contractor`
- `/contractor/register`
- `/contractor/bids`
- `/contractor/jobs`
- `/map`

### 모바일

- Flutter

고객 앱과 업체 앱은 2차 이후 Flutter로 확장한다. 1차 MVP에서는 모바일 앱을 만들지 않지만, API는 나중에 Flutter 앱에서도 그대로 사용할 수 있도록 웹 전용 응답 구조에 묶이지 않게 설계한다.

### 인증

인증 방식은 Supabase Auth를 우선 사용한다.

1차 MVP 인증 기준:

- 고객: 별도 회원가입 없이 연락처 기반 신고 생성/조회
- 관리자: Supabase Auth 이메일/비밀번호 로그인
- 업체: Supabase Auth 이메일/비밀번호 회원가입/로그인

2차 이후 확장:

- 고객 카카오 로그인
- 업체 카카오 로그인 또는 소셜 로그인
- 고객 연락처 기반 신고 데이터와 카카오 계정 연결

Supabase Auth는 Kakao OAuth Provider를 지원하므로, 2차에서 카카오 로그인을 추가할 수 있다. 다만 카카오 계정에서 이메일이 항상 보장되지 않을 수 있으므로 고객 식별의 기본값은 계속 연락처와 신고 접수번호/확인번호를 유지한다.

백엔드 권한 검사는 NestJS에서 수행한다. Supabase Auth의 JWT를 검증한 뒤, 서비스 DB의 역할/상태/승인 여부를 확인한다.

권장 사용자 연결 구조:

- Supabase `auth.users`: 로그인 계정 원천
- `admin_users`: 관리자 프로필 및 권한
- `contractor_accounts`: 업체 계정 프로필
- `customers`: 고객 연락처 기반 프로필

관리자 초기 계정은 Prisma seed로 생성한다. 초기 관리자 이메일과 임시 비밀번호는 환경변수로 주입하고, 첫 로그인 후 비밀번호 변경을 요구한다.

### 파일 저장

파일 저장소는 Supabase Storage 사용을 우선 후보로 둔다. 사진, 영상, 사업자등록증, 완료 사진은 모두 파일 메타데이터와 실제 저장소 경로를 분리해서 관리한다.

### 배포 환경

권장 1차 배포 구성:

- 프론트엔드: Vercel
- 백엔드: Railway Southeast Asia/Singapore
- 데이터베이스: Supabase PostgreSQL Northeast Asia/Seoul
- 파일 저장소: Supabase Storage Northeast Asia/Seoul

Render는 현재 공식 지원 리전에 한국이 없고, 아시아 리전은 Singapore를 제공한다. 이미 Railway Singapore를 사용 중이라면 1차 백엔드는 Railway를 유지하는 편이 낫다.

Supabase는 Seoul 리전을 제공하므로 한국 사용자 대상 서비스에서는 DB와 Storage를 Seoul에 두는 것을 우선한다. NestJS 백엔드가 Railway Singapore에서 Supabase Seoul로 접근하는 구조는 초기 MVP에 충분히 현실적이며, 성능 문제가 보이면 이후 한국 리전 서버 또는 AWS Seoul 기반 배포로 옮긴다.

### 지도 Provider

1차 MVP의 기본 지도 Provider는 카카오맵으로 확정한다.

- 지도 표시: Kakao Maps JavaScript SDK
- 주소 -> 좌표 변환: Kakao Local API
- 좌표 -> 주소 변환: Kakao Local API
- 상호명/키워드 검색: Kakao Local API

지도 기능은 `MapProvider` 추상화를 통해 구현한다. 서비스 코드가 카카오 API 응답 형식에 직접 의존하지 않도록 하고, 향후 네이버지도 또는 다른 지도 Provider를 보조 검색이나 대체 Provider로 붙일 수 있게 한다.

권장 Provider 구조:

- `MapProvider` 인터페이스
- `KakaoMapProvider` 1차 구현체
- `NaverMapProvider` 2차 후보 구현체
- `MapProviderFactory` 또는 설정 기반 provider 선택

지도 Provider 상세 설계는 `docs/map_provider_design_v1.md`를 기준으로 한다.

### 환경변수 관리

환경변수는 앱별로 분리한다. 루트 `.env` 하나에 모든 값을 몰아넣지 않는다.

권장 앱별 env 구조:

- `apps/web/.env.example`
- `apps/web/.env`
- `apps/web/.env.dev`
- `apps/web/.env.prd`
- `apps/server/.env.example`
- `apps/server/.env`
- `apps/server/.env.dev`
- `apps/server/.env.prd`
- `apps/mobile/.env.example`
- `apps/mobile/.env`
- `apps/mobile/.env.dev`
- `apps/mobile/.env.prd`

원칙:

- 실제 `.env`, `.env.dev`, `.env.prd` 파일은 git에 커밋하지 않는다.
- 각 앱은 자기 실행에 필요한 환경변수만 가진다.
- 브라우저에 노출 가능한 값만 `NEXT_PUBLIC_` 접두사로 웹 env에 둔다.
- Supabase service role key, DB URL, AI API key, Kakao REST API key 같은 비밀값은 백엔드 env에만 둔다.
- Flutter 앱 env에는 public config만 둔다. 모바일 앱에 service role key나 AI API key를 넣지 않는다.
- 배포 환경에서도 Vercel, Railway, Flutter 빌드 설정이 각각 자기 앱 env를 관리한다.
- 개발 실행 시 `pnpm env:dev`가 각 앱의 `.env.dev`를 `.env`로 복사한다.
- 운영 빌드용 로컬 환경 전환 시 `pnpm env:prd`가 각 앱의 `.env.prd`를 `.env`로 복사한다.

앱별 env 상세 전략은 `docs/env_strategy_v1.md`를 기준으로 한다.

### 협업 및 커밋 규칙

- 작업 단위별로 커밋한다.
- 커밋 메시지는 한글로 작성한다.
- 기능 구현, 문서 변경, 설정 변경, 리팩터링은 가능한 한 별도 커밋으로 나눈다.
- 각 작업 단위가 끝나면 원격 저장소로 푸시한다.
- 원격 저장소는 `https://github.com/Dev-HLeah/baro-ddulrim.git`을 사용한다.

커밋 메시지 예시:

- `문서: 1차 MVP 개발 계획 정리`
- `설정: Next.js와 NestJS 프로젝트 초기 구성`
- `기능: 고객 신고 채팅 화면 추가`
- `기능: 관리자 신고 검수 화면 추가`
- `기능: 업체 입찰 제출 기능 추가`
- `수정: 신고 상태 변경 이력 저장 보완`

## 3. 사용자 역할

### 고객

- 연락처를 입력하고 신고를 시작한다.
- 웹형 채팅으로 위치, 문제 유형, 증상, 긴급도, 연락처를 제공한다.
- 사진/영상은 선택으로 첨부한다.
- 접수 이후 연락처로 본인의 신고 목록을 조회한다.
- 신고 상세에서 진행 상태, 관리자 추가 질문, 배정 결과, 처리 결과를 확인한다.

### 관리자

- 신고 접수 내용을 확인한다.
- AI가 분석한 내용을 수정할 수 있다.
- 필수 정보가 부족하면 고객에게 추가 질문을 보낸다.
- 신고 내용을 승인한 뒤 지역별 업체에게 입찰을 공개한다.
- 업체 등록 정보를 검토하고 승인/반려/활동 제한한다.
- 입찰 목록을 보고 업체를 최종 배정한다.
- 고객 안내 메시지 템플릿을 생성/수정/선택한다.
- AI 엔진을 OpenAI 또는 Google Gemini로 전환한다.
- 지도와 대시보드에서 신고/처리 현황을 확인한다.

1차 MVP의 관리자 권한은 단일 관리자 모델로 간다.

### 업체

- 회원가입/로그인한다.
- 업체 정보를 등록한다.
- 관리자 승인 후 지역에 맞는 신고 입찰 목록을 확인한다.
- 입찰 시 예상 견적, 출동 가능 시간, 작업 메모, 추가 비용 발생 조건을 입력한다.
- 배정 후 진행 상태, 완료 사진, 최종 금액, 작업 메모를 직접 입력한다.

## 4. 고객 신고 흐름

1. 고객이 웹에 접속한다.
2. 연락처를 입력한다.
3. 신규 신고 또는 기존 신고 조회를 선택한다.
4. 신규 신고 시 AI 채팅이 시작된다.
5. AI 첫 메시지 예시:

   "안녕하세요. 바로 뚫림입니다. 어떤 내용을 접수하시겠습니까? 접수에 필요한 내용은 위치, 문제 유형, 증상 설명, 긴급도, 연락처입니다. 사진이나 영상을 첨부하면 더 정확하게 담당 업체에 배정될 수 있습니다."

6. 고객이 주소, 동 이름, 상호명 등 위치 정보를 입력한다.
7. 시스템은 위치 입력값을 좌표로 변환하고 지도 마커를 준비한다.
8. 고객이 증상, 긴급도, 사진/영상 등을 입력한다.
9. AI가 필수 정보 누락 여부를 확인한다.
10. 필수 정보가 부족하면 AI가 추가 질문한다.
11. AI가 신고 내용을 구조화한다.
12. 관리자 검수 대상으로 넘어간다.
13. 관리자가 부족한 내용을 발견하면 고객에게 추가 질문을 보낸다.
14. 고객 답변까지 포함해 신고 기록이 갱신된다.

## 5. 필수/선택 신고 정보

### 필수

- 위치
- 문제 유형
- 증상 설명
- 긴급도
- 연락처

### 선택

- 사진
- 영상

사진/영상 첨부 안내 문구:

"사진이나 영상을 첨부하면 더 정확하게 담당 업체에 배정될 수 있습니다."

## 6. AI 분석 범위

AI는 신고 내용을 바로 확정하지 않고 관리자 검수용 초안을 만든다.

AI 분석 결과:

- 상담 요약
- 위치/좌표 후보
- 문제 유형
- 긴급도
- 필수 정보 누락 여부
- 업체 공유용 설명
- AI 분석 신뢰도 또는 확인 필요 표시
- 사용한 AI 엔진
- 사용한 모델명
- 분석 시각

관리자는 AI 초안을 확인하고 수정한다. 관리자 승인 후에만 업체 입찰 대상으로 공개된다.

관리자 설정에서 AI 엔진을 전환할 수 있어야 한다.

- OpenAI API
- Google Gemini / Google AI Studio

## 7. 신고 상태 흐름

기본 흐름:

1. `정보 수집중`
2. `AI 분석 완료`
3. `관리자 검수중`
4. `고객 추가질문 필요`
5. `입찰 승인`
6. `입찰중`
7. `업체 배정`
8. `출동 예정`
9. `출동 완료`
10. `처리중`
11. `해결 완료`

예외 상태:

- `보류`
- `취소`
- `반려`

상태 변경은 모두 이력으로 남긴다.

- 변경 전 상태
- 변경 후 상태
- 변경자 유형: AI, 관리자, 업체, 시스템
- 변경자 ID
- 변경 시각
- 변경 사유 또는 메모

## 8. 고객 신고 조회 방식

신고 생성 시 접수번호와 확인번호를 발급한다.

개발/초기 검증 모드:

- 연락처만 입력해도 신고 목록과 상세를 조회할 수 있다.

운영 모드:

- 연락처로 신고 목록을 조회한다.
- 상세 조회에는 접수번호 또는 확인번호를 요구할 수 있다.

SMS/카카오톡 자동 발송은 2차 범위지만, 나중에 접수번호와 확인번호를 발송할 수 있도록 데이터와 템플릿 구조는 준비한다.

## 9. 업체 등록 및 승인

업체는 가입 후 업체 프로필을 등록해야 한다.

업체 등록 정보:

- 업체명
- 업체 사진
- 업체 위치
- 활동 지역
- 활동 반경
- 대표자 이름
- 사업자 번호
- 사업자등록증 파일
- 연락처
- 소개 문구

업체 상태:

- `심사중`
- `승인됨`
- `활동중`
- `비활성`
- `활동 제한`
- `반려`

관리자는 업체 정보를 확인하고 상태를 변경할 수 있다. 상태 변경 사유도 기록한다.

승인된 업체만 입찰에 참여할 수 있다.

## 10. 입찰 및 배정 흐름

1. 관리자가 신고 내용을 확인/수정한다.
2. 관리자가 신고를 입찰 승인한다.
3. 신고 지역에 맞는 승인 업체에게 입찰이 공개된다.
4. 업체가 입찰을 제출한다.
5. 관리자가 입찰 목록을 확인한다.
6. 관리자가 최종 업체를 선택한다.
7. 배정 기록이 생성된다.
8. 고객 웹 화면에 배정 결과가 표시된다.
9. 선택된 고객 안내 메시지 템플릿이 적용된다.

입찰 입력 항목:

- 예상 견적
- 출동 가능 시간
- 작업 가능 여부
- 작업 메모
- 추가 비용 발생 조건
- 입찰 제출 시각
- 업체 담당자 정보

배정 기록:

- 신고 ID
- 선택된 입찰 ID
- 선택된 업체 ID
- 배정 관리자
- 배정 시각
- 선택 사유
- 고객 안내 메시지 템플릿 ID
- 고객 안내 메시지 렌더링 결과

향후 고객 선택형으로 바꿀 수 있도록 `입찰`과 `배정`은 분리한다.

## 11. 배정 이후 작업 기록

배정 이후 작업 진행 기록은 업체가 직접 입력한다.

업체 입력 항목:

- 출동 예정
- 출동 완료
- 처리중
- 해결 완료
- 완료 사진
- 최종 금액
- 작업 메모

관리자는 업체가 입력한 내용을 확인하고 필요 시 수정할 수 있다.

고객 웹과 지도 화면에는 진행 상태가 반영된다.

## 12. 메시지 템플릿

1차 MVP에서는 SMS/카카오톡 자동 발송은 제외한다.

대신 관리자에서 고객 안내 메시지 템플릿을 관리한다.

필요 기능:

- 템플릿 생성
- 템플릿 수정
- 템플릿 목록
- 템플릿 버전 이력
- 템플릿 사용 이력
- 배정 시 사용할 템플릿 선택
- 신고/업체/견적/출동시간 값을 템플릿에 매핑

템플릿 예시 변수:

- `{{customer_phone}}`
- `{{report_no}}`
- `{{issue_summary}}`
- `{{company_name}}`
- `{{estimated_price}}`
- `{{available_time}}`
- `{{extra_cost_policy}}`
- `{{status_url}}`

## 13. 지도 화면

별도 지도 화면을 제공한다.

1차 지도 Provider는 카카오맵을 사용한다. 단, 화면과 API는 `MapProvider` 추상화를 통해 카카오에 직접 묶이지 않게 설계한다.

지도 요구사항:

- 정확한 위치 기준으로 마커 표시
- 주소, 동 이름, 상호명 입력값을 좌표로 변환
- 신고 위치 마커 표시
- 마커 클릭 시 신고 요약 표시
- 상태별 마커 구분
- 긴급 여부 표시
- 문제 유형 필터
- 처리 상태 필터
- 날짜 필터
- 신고 상세로 이동
- 해결 완료된 신고도 지도에서 확인 가능

지도는 관리자 화면과 분리된 외부 현황 화면으로 구성할 수 있다. 단, 정확한 위치를 표시하므로 운영 배포 전 접근 권한 정책을 다시 확인해야 한다.

## 14. 대시보드 통계

관리자 대시보드에는 다음 지표를 표시한다.

- 전체 신고 건수
- 상태별 신고 건수
- 유입 채널별 신고 건수
- 지역별 신고 건수
- 문제 유형별 신고 건수
- 긴급 여부별 신고 건수
- 업체별 배정 건수
- 업체별 해결 완료 건수
- 평균 접수 승인 시간
- 평균 업체 배정 시간
- 평균 업체 처리 시간

처리 속도 기준:

- 신고 생성 시각 -> 관리자 접수 승인 시각
- 신고 생성 시각 -> 업체 배정 시각
- 업체 배정 시각 -> 해결 완료 시각

1차 유입 채널:

- 웹

향후 유입 채널:

- 앱
- SMS
- 카카오톡
- AI 전화

## 15. 데이터 모델 초안

### `customers`

- `id`
- `phone`
- `created_at`
- `updated_at`

고객은 1차에서 별도 회원가입 없이 연락처 중심으로 관리한다.

### `reports`

- `id`
- `report_no`
- `verification_code`
- `customer_id`
- `channel`
- `status`
- `issue_type`
- `urgency`
- `summary`
- `description`
- `customer_phone`
- `address_text`
- `place_name`
- `latitude`
- `longitude`
- `admin_approved_at`
- `assigned_at`
- `resolved_at`
- `created_at`
- `updated_at`

### `report_messages`

- `id`
- `report_id`
- `sender_type`
- `sender_id`
- `message_type`
- `content`
- `created_at`

`sender_type` 예시:

- `customer`
- `ai`
- `admin`
- `system`

### `report_attachments`

- `id`
- `report_id`
- `message_id`
- `file_type`
- `file_url`
- `original_name`
- `created_at`

### `ai_analysis`

- `id`
- `report_id`
- `provider`
- `model`
- `raw_input`
- `raw_output`
- `summary`
- `issue_type`
- `urgency`
- `missing_fields`
- `vendor_description`
- `confidence`
- `needs_review`
- `created_at`

### `report_revisions`

- `id`
- `report_id`
- `editor_type`
- `editor_id`
- `field_name`
- `old_value`
- `new_value`
- `reason`
- `created_at`

### `report_status_history`

- `id`
- `report_id`
- `from_status`
- `to_status`
- `actor_type`
- `actor_id`
- `reason`
- `created_at`

### `contractor_accounts`

- `id`
- `email`
- `password_hash`
- `name`
- `phone`
- `created_at`
- `updated_at`

### `contractor_companies`

- `id`
- `account_id`
- `company_name`
- `representative_name`
- `business_number`
- `business_license_file_url`
- `company_photo_url`
- `address`
- `latitude`
- `longitude`
- `service_regions`
- `service_radius_km`
- `description`
- `status`
- `status_reason`
- `approved_at`
- `created_at`
- `updated_at`

### `bids`

- `id`
- `report_id`
- `contractor_company_id`
- `estimated_price`
- `available_time`
- `can_work`
- `work_note`
- `extra_cost_policy`
- `status`
- `submitted_at`
- `created_at`
- `updated_at`

### `assignments`

- `id`
- `report_id`
- `bid_id`
- `contractor_company_id`
- `assigned_by_admin_id`
- `selection_reason`
- `customer_message_template_id`
- `customer_message_rendered`
- `assigned_at`
- `created_at`

### `work_updates`

- `id`
- `report_id`
- `assignment_id`
- `contractor_company_id`
- `status`
- `note`
- `final_price`
- `created_at`

### `message_templates`

- `id`
- `name`
- `channel`
- `content`
- `is_active`
- `created_at`
- `updated_at`

### `message_template_versions`

- `id`
- `template_id`
- `version_no`
- `content`
- `created_at`

### `message_template_usages`

- `id`
- `template_id`
- `template_version_id`
- `report_id`
- `assignment_id`
- `rendered_content`
- `created_at`

### `app_settings`

- `id`
- `key`
- `value`
- `updated_at`

설정 예시:

- `ai_provider`
- `customer_lookup_mode`
- `map_access_mode`

## 16. 화면 목록

### 고객 웹

- 연락처 입력
- 신규 신고 시작
- 웹형 채팅 신고
- 사진/영상 첨부
- 신고 목록
- 신고 상세
- 진행 상태 타임라인
- 관리자 추가 질문 답변
- 업체 배정 결과
- 처리 완료 결과

### 관리자 웹

- 로그인
- 대시보드
- 신고 목록
- 신고 상세
- AI 분석 결과 확인
- 신고 내용 수정
- 고객 추가 질문 작성
- 입찰 승인
- 입찰 목록
- 업체 배정
- 지도 현황
- 업체 목록
- 업체 상세/승인
- 업체 상태 변경
- 메시지 템플릿 목록
- 메시지 템플릿 편집
- AI 설정
- 조회 보안 모드 설정

### 업체 웹

- 회원가입
- 로그인
- 업체 등록
- 승인 대기 화면
- 입찰 가능한 신고 목록
- 신고 상세
- 입찰 제출
- 내 입찰 목록
- 배정된 작업 목록
- 작업 진행 상태 변경
- 완료 사진/최종 금액/작업 메모 입력

### 지도 현황 웹

- 지도 전체 화면
- 신고 마커
- 상태/유형/긴급/날짜 필터
- 마커 상세 패널
- 신고 상세 이동

## 17. 컴포넌트 개발 원칙

화면 구성 요소를 작은 단위로 나누고 최대한 재사용한다.

공통 컴포넌트:

- `AppShell`
- `PageHeader`
- `SidebarNav`
- `TopBar`
- `DataTable`
- `FilterBar`
- `SearchInput`
- `StatusBadge`
- `UrgencyBadge`
- `Timeline`
- `MetricCard`
- `EmptyState`
- `ConfirmDialog`
- `FileUploader`
- `ImagePreviewGrid`
- `MapView`
- `MapMarker`
- `LocationPicker`
- `ChatThread`
- `ChatMessage`
- `MessageComposer`
- `TemplateEditor`

도메인 컴포넌트:

- `ReportList`
- `ReportDetailPanel`
- `ReportSummaryCard`
- `AiAnalysisPanel`
- `AdminRevisionForm`
- `CustomerQuestionBox`
- `BidList`
- `BidForm`
- `AssignmentPanel`
- `ContractorProfileForm`
- `ContractorApprovalPanel`
- `WorkUpdateTimeline`
- `DashboardStats`

컴포넌트 기준:

- 데이터 조회 로직과 UI 표현 로직을 분리한다.
- 상태 배지는 모든 화면에서 같은 컴포넌트를 사용한다.
- 채팅 UI는 고객, 관리자 상세, 신고 상세에서 재사용한다.
- 지도는 관리자 지도와 외부 지도 현황에서 같은 기본 컴포넌트를 사용한다.
- 템플릿 에디터는 향후 SMS/카카오톡 발송에도 재사용 가능하게 만든다.

## 18. 디자인 방향

디자인은 모던하고 깔끔하게 간다.

- 화려한 장식은 피한다.
- 그라데이션은 사용하지 않는다.
- 관리 도구는 정보 밀도와 가독성을 우선한다.
- 고객 신고 화면은 채팅 중심으로 단순하게 만든다.
- 업체 화면은 입찰과 작업 업데이트를 빠르게 할 수 있어야 한다.
- 카드 남용을 피하고, 반복 목록/상세 패널/모달에만 제한적으로 사용한다.

색상 방향:

- 메인 컬러는 시원한 하늘색 계열
- 너무 밝거나 연한 하늘색은 피한다.
- 예시 메인 컬러: `#1E9BD7`
- 보조 컬러: `#0F766E`
- 성공: `#16A34A`
- 경고: `#D97706`
- 위험: `#DC2626`
- 본문 텍스트: `#1F2937`
- 보조 텍스트: `#6B7280`
- 배경: `#F8FAFC`
- 선: `#E5E7EB`

UI 규칙:

- 기본 radius는 8px 이하
- 버튼에는 가능한 아이콘을 함께 사용
- 데이터 테이블, 필터, 상태 배지를 일관되게 구성
- 모바일에서도 텍스트가 버튼/카드 밖으로 넘치지 않게 처리
- 관리자 화면은 대시보드형 SaaS 느낌으로 차분하게 구성

## 19. 테스트 방침

1차 개발에서는 기능별 자동 테스트 코드를 작성하지 않는다.

대신 큰 흐름이 만들어진 뒤 마일스톤별 기능 테스트를 진행한다.

기능 테스트 체크리스트:

- 고객이 연락처를 입력하고 신고를 시작할 수 있는가
- AI가 필수 정보를 확인하고 누락 항목을 질문하는가
- 신고 내용이 관리자 화면에 표시되는가
- 관리자가 AI 분석값을 수정할 수 있는가
- 관리자가 고객에게 추가 질문을 보낼 수 있는가
- 관리자가 신고를 입찰 승인할 수 있는가
- 지역에 맞는 업체에게 입찰 건이 보이는가
- 업체가 입찰을 제출할 수 있는가
- 관리자가 업체를 배정할 수 있는가
- 고객 화면에 배정 결과가 표시되는가
- 메시지 템플릿이 적용되는가
- 업체가 작업 상태와 완료 정보를 입력할 수 있는가
- 지도에 신고 마커와 상태가 표시되는가
- 대시보드 평균 시간이 계산되는가

자동 테스트는 운영 안정화 단계에서 별도 도입한다.

## 20. 개발 단계

### 1단계: 프로젝트 기반 구성

- Next.js 프론트엔드 구조 구성
- NestJS 백엔드 구조 구성
- Prisma/Supabase 연결
- 공통 UI 컴포넌트 기반 구성
- 인증 기본 구조
- API/DB 기본 구조
- 디자인 토큰 정의

### 2단계: 고객 신고 웹

- 연락처 입력
- 신규 신고 채팅
- 필수 정보 수집
- 사진/영상 첨부 UI
- 신고 목록/상세 조회
- 개발 모드 연락처 조회
- 접수번호/확인번호 데이터 발급

### 3단계: AI 분석 및 관리자 검수

- AI provider 설정
- OpenAI/Gemini 전환 구조
- AI 분석 결과 저장
- 관리자 신고 목록/상세
- AI 분석값 수정
- 고객 추가 질문
- 관리자 승인

### 4단계: 업체 등록/승인

- 업체 회원가입/로그인
- 업체 프로필 등록
- 사업자등록증 업로드
- 관리자 업체 검토
- 업체 상태 변경

### 5단계: 입찰/배정

- 지역 기반 입찰 공개
- 업체 입찰 제출
- 관리자 입찰 목록
- 관리자 업체 배정
- 고객 안내 메시지 템플릿 적용
- 배정 결과 고객 화면 표시

### 6단계: 작업 진행 및 지도

- 업체 작업 상태 변경
- 완료 사진/최종 금액/작업 메모 입력
- 지도 마커 표시
- 상태/유형/긴급 필터
- 신고 상세 연동

### 7단계: 대시보드 및 운영 지표

- 신고 채널별 통계
- 상태별 통계
- 지역별 통계
- 유형별 통계
- 긴급 여부별 통계
- 업체별 배정/완료 통계
- 평균 처리 시간 계산

### 8단계: 통합 기능 테스트 및 정리

- 고객 신고부터 해결 완료까지 전체 흐름 테스트
- 관리자 검수/수정/질문 테스트
- 업체 등록/승인/입찰/작업 업데이트 테스트
- 지도/대시보드 표시 테스트
- 운영 모드 전환 전 보안 설정 확인

## 21. 완료 기준

1차 MVP 완료 기준:

- 고객이 웹에서 신고를 생성할 수 있다.
- AI가 신고 내용을 구조화하고 누락 정보를 질문할 수 있다.
- 관리자가 신고 내용을 수정하고 승인할 수 있다.
- 승인된 신고가 지역별 업체에게 공개된다.
- 업체가 입찰할 수 있다.
- 관리자가 업체를 배정할 수 있다.
- 고객이 웹에서 배정 결과와 진행 상태를 볼 수 있다.
- 업체가 배정 이후 작업 진행을 입력할 수 있다.
- 지도에서 신고 위치와 상태를 확인할 수 있다.
- 관리자 대시보드에서 주요 통계를 볼 수 있다.
- 모든 주요 이벤트가 기록으로 남는다.

## 22. 남은 결정 사항

추가로 확정이 필요한 항목:

- 실제 배포 환경 세부값: Railway 프로젝트, Vercel 프로젝트, Supabase 프로젝트 연결 정보
- 업체 활동 지역 입력 방식: 행정구역 선택형 또는 반경 km 입력형
- 외부 지도 화면 접근 권한 정책
- AI 모델별 기본 모델명
- 사업자번호 검증을 수동으로 할지 외부 API로 할지 여부
- Supabase Storage 버킷 정책
