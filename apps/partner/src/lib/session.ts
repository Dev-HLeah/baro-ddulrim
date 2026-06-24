import {
  getMyContext,
  type ContractorCompany,
  type ContractorContext
} from "@/lib/contractor-api";

/**
 * 로그인한 업체의 계정/업체 컨텍스트를 불러온다.
 * 미들웨어가 세션을 보장하므로, 여기서는 백엔드에서 계정·업체 정보를 가져온다.
 */
export async function loadMyContext(): Promise<ContractorContext | null> {
  return getMyContext();
}

export function isApprovedCompany(company: ContractorCompany): boolean {
  return company.status === "APPROVED" || company.status === "ACTIVE";
}
