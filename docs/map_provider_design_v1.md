# 바로 뚫림 MapProvider 설계 v1

## 1. 결정 사항

1차 MVP의 지도 Provider는 카카오맵으로 확정한다.

- 기본 Provider: Kakao
- 향후 후보 Provider: Naver
- 지도 표시: Kakao Maps JavaScript SDK
- 주소 검색/좌표 변환/상호명 검색: Kakao Local API

지도 기능은 `MapProvider` 추상화를 통해 구현한다. 고객 신고, 관리자 검수, 업체 입찰, 지도 현황 화면은 모두 같은 내부 위치 모델을 사용하고, 외부 지도 API 응답 형식은 Provider 내부에서만 다룬다.

## 2. 추상화 목표

`MapProvider`는 다음 문제를 막기 위한 경계다.

- 카카오 API 응답 필드가 도메인 코드와 DB 구조에 직접 퍼지는 문제
- 나중에 네이버지도나 다른 Provider를 붙일 때 전체 코드를 수정해야 하는 문제
- 주소 검색, 상호명 검색, 좌표 변환 결과의 신뢰도/출처를 기록하기 어려운 문제
- 고객 입력 위치와 관리자 확정 위치를 구분하기 어려운 문제

## 3. 주요 사용 흐름

### 고객 신고

1. 고객이 주소, 동 이름, 상호명 중 하나를 입력한다.
2. 백엔드가 `MapProvider.searchLocation()`을 호출한다.
3. Provider가 후보 위치 목록을 반환한다.
4. AI 또는 시스템이 가장 가능성 높은 후보를 신고 초안에 연결한다.
5. 고객 또는 관리자가 지도에서 최종 위치를 확인/수정한다.

### 관리자 검수

1. 관리자가 신고 상세에서 위치 후보를 확인한다.
2. 필요하면 주소/상호명을 다시 검색한다.
3. 관리자가 최종 좌표를 확정한다.
4. 확정 좌표가 지도 마커와 업체 지역 매칭 기준으로 사용된다.

### 지도 현황

1. 지도 화면은 DB에 저장된 최종 좌표를 사용한다.
2. 지도 SDK는 마커 표시와 지도 이동에만 사용한다.
3. 지도 화면은 Provider별 검색 응답을 직접 알 필요가 없다.

## 4. 내부 위치 모델

프론트와 백엔드가 공유할 위치 타입은 Provider 독립적으로 정의한다.

```ts
export type MapProviderName = 'kakao' | 'naver';

export type LocationSource =
  | 'customer_input'
  | 'ai_candidate'
  | 'admin_confirmed'
  | 'contractor_profile'
  | 'system';

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface LocationCandidate {
  provider: MapProviderName;
  providerPlaceId?: string;
  source: LocationSource;
  title: string;
  addressText?: string;
  roadAddressText?: string;
  placeName?: string;
  category?: string;
  point: GeoPoint;
  confidence?: number;
  raw?: unknown;
}

export interface ConfirmedLocation {
  provider: MapProviderName;
  providerPlaceId?: string;
  addressText?: string;
  roadAddressText?: string;
  placeName?: string;
  point: GeoPoint;
  confirmedBy: 'customer' | 'admin' | 'system';
  confirmedAt: string;
}
```

`raw`는 디버깅과 재분석을 위해 저장할 수 있지만, 도메인 로직이 `raw`에 의존하면 안 된다.

## 5. 백엔드 Provider 인터페이스

NestJS 백엔드의 `maps` 모듈에 Provider 인터페이스를 둔다.

```ts
export interface MapProvider {
  readonly name: MapProviderName;

  searchLocation(query: SearchLocationInput): Promise<LocationCandidate[]>;

  geocodeAddress(input: GeocodeAddressInput): Promise<LocationCandidate[]>;

  reverseGeocode(point: GeoPoint): Promise<ReverseGeocodeResult>;
}

export interface SearchLocationInput {
  query: string;
  regionHint?: string;
  limit?: number;
}

export interface GeocodeAddressInput {
  address: string;
  regionHint?: string;
  limit?: number;
}

export interface ReverseGeocodeResult {
  provider: MapProviderName;
  point: GeoPoint;
  addressText?: string;
  roadAddressText?: string;
  region1DepthName?: string;
  region2DepthName?: string;
  region3DepthName?: string;
  raw?: unknown;
}
```

## 6. 카카오 구현 책임

`KakaoMapProvider`는 다음 카카오 API를 감싼다.

- 키워드로 장소 검색
- 주소로 좌표 변환
- 좌표로 주소 변환
- 좌표로 행정구역정보 변환

카카오 API 키는 서버 환경변수로 관리한다.

권장 환경변수:

- `apps/server/.env`: `KAKAO_REST_API_KEY`
- `apps/server/.env`: `MAP_PROVIDER=kakao`
- `apps/web/.env.local`: `NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY`
- `apps/mobile/.env`: `KAKAO_JAVASCRIPT_KEY` 또는 Flutter 지도 SDK용 public key

REST API 키는 프론트에 노출하지 않는다. JavaScript SDK 키만 브라우저에 노출한다.

## 7. 프론트엔드 지도 컴포넌트

Next.js 프론트는 지도 SDK에 직접 강하게 묶이지 않도록 얇은 컴포넌트 경계를 둔다.

권장 컴포넌트:

- `MapView`
- `MapMarker`
- `LocationSearchInput`
- `LocationCandidateList`
- `LocationPicker`
- `ReportMap`
- `AdminLocationEditor`

`MapView`는 1차에서 카카오맵 SDK를 사용하지만, props는 Provider 독립 타입으로 유지한다.

```ts
export interface MapViewProps {
  center: GeoPoint;
  markers: MapMarkerData[];
  zoom?: number;
  onMarkerClick?: (marker: MapMarkerData) => void;
  onMapClick?: (point: GeoPoint) => void;
}

export interface MapMarkerData {
  id: string;
  point: GeoPoint;
  title?: string;
  status?: string;
  urgency?: string;
  issueType?: string;
}
```

## 8. API 엔드포인트 초안

백엔드는 지도 검색을 직접 처리하고, 프론트는 내부 API만 호출한다.

- `GET /maps/search?query=&regionHint=`
- `GET /maps/geocode?address=&regionHint=`
- `GET /maps/reverse-geocode?lat=&lng=`

관리자 위치 확정:

- `PATCH /reports/:id/location`

요청 예시:

```json
{
  "provider": "kakao",
  "providerPlaceId": "123456",
  "addressText": "서울특별시 강남구 ...",
  "roadAddressText": "서울특별시 강남구 ...",
  "placeName": "상호명",
  "latitude": 37.123456,
  "longitude": 127.123456,
  "confirmedBy": "admin"
}
```

## 9. DB 반영 항목

기존 `reports` 위치 필드에 Provider 정보를 추가한다.

- `location_provider`
- `location_provider_place_id`
- `address_text`
- `road_address_text`
- `place_name`
- `latitude`
- `longitude`
- `location_confirmed_at`
- `location_confirmed_by`

위치 후보 이력을 따로 남기려면 `report_location_candidates` 테이블을 둔다.

### `report_location_candidates`

- `id`
- `report_id`
- `provider`
- `provider_place_id`
- `source`
- `title`
- `address_text`
- `road_address_text`
- `place_name`
- `category`
- `latitude`
- `longitude`
- `confidence`
- `raw`
- `created_at`

## 10. 비용 관리

1차 MVP에서는 신고 1건당 지도 검색 호출 수를 제한한다.

권장 제한:

- 고객 입력 1회당 위치 후보 검색 최대 1회
- 후보 목록 최대 5개
- 관리자 재검색은 사용자 액션이 있을 때만 수행
- 신고에 확정 좌표가 있으면 지도 화면에서 재검색하지 않음
- 주소/상호명 검색 결과는 신고 단위로 저장해 재사용

카카오 무료 쿼터 초과를 막기 위해 관리자 설정 또는 환경변수로 지도 API 호출 제한을 둘 수 있게 한다.

권장 설정:

- `MAP_SEARCH_MAX_RESULTS=5`
- `MAP_SEARCH_CACHE_ENABLED=true`
- `MAP_DAILY_SOFT_LIMIT`

## 11. 구현 단계

1. `maps` 모듈 생성
2. `MapProvider` 인터페이스 정의
3. `KakaoMapProvider` 구현
4. 지도 검색 API 엔드포인트 구현
5. 위치 후보 저장 구조 추가
6. 신고 생성/관리자 검수 화면에 위치 후보 연결
7. `MapView`와 `LocationPicker` 구현
8. 지도 현황 화면에서 확정 좌표 기반 마커 표시
9. 네이버 Provider가 필요해질 때 `NaverMapProvider`만 추가
