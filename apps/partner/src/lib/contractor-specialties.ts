export const CONTRACTOR_SPECIALTIES = [
  "하수관 청소",
  "배관 막힘 해결",
  "정화조 청소",
  "우수관 청소",
  "빗물받이 청소",
  "배관 누수 수리",
  "역류 차단기 설치",
  "펌프 설치/수리",
] as const;

export type ContractorSpecialty = (typeof CONTRACTOR_SPECIALTIES)[number];
