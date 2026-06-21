import { cookies } from "next/headers";
import { getMyCompany, type ContractorCompany } from "@/lib/contractor-api";

export const PARTNER_COMPANY_COOKIE = "partner_company_id";

export async function getMyCompanyId(): Promise<string | null> {
  const store = await cookies();
  return store.get(PARTNER_COMPANY_COOKIE)?.value ?? null;
}

/**
 * 쿠키에 저장된 "내 업체" id로 업체를 조회한다.
 * 등록 전(쿠키 없음)이거나 업체가 삭제된 경우 null.
 */
export async function loadMyCompany(): Promise<ContractorCompany | null> {
  const companyId = await getMyCompanyId();

  if (!companyId) {
    return null;
  }

  return getMyCompany(companyId);
}

export function isApprovedCompany(company: ContractorCompany): boolean {
  return company.status === "APPROVED" || company.status === "ACTIVE";
}
