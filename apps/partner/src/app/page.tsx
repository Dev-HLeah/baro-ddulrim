import { redirect } from "next/navigation";
import { logoutAction } from "@/app/actions";
import {
  ContractorNavigationPanel,
  ContractorRejectedScreen,
  ContractorSummaryMetrics,
  ContractorWaitingScreen,
} from "@/components/contractor-sections";
import {
  getContractorAssignments,
  getContractorBids,
  getContractorOpportunities,
} from "@/lib/contractor-api";
import { isApprovedCompany, loadMyContext } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ContractorPage() {
  const context = await loadMyContext();

  // 등록된 업체가 없으면 바로 업체 등록 신청 화면으로 보낸다.
  if (!context?.company) {
    redirect("/register");
  }

  const company = context.company;

  return (
    <main className="workspace-page contractor-page">
      <header className="workspace-header">
        <div>
          <p className="eyebrow">업체</p>
          <h1>업체 작업대</h1>
        </div>
        <form action={logoutAction}>
          <button className="secondary-button" type="submit">
            로그아웃
          </button>
        </form>
      </header>

      {company.status === "REJECTED" ? (
        <ContractorRejectedScreen company={company} />
      ) : !isApprovedCompany(company) ? (
        <ContractorWaitingScreen company={company} />
      ) : (
        <ApprovedWorkspace companyId={company.id} />
      )}
    </main>
  );
}

async function ApprovedWorkspace({ companyId }: { companyId: string }) {
  const [opportunities, bids, assignments] = await Promise.all([
    getContractorOpportunities(companyId),
    getContractorBids(companyId),
    getContractorAssignments(companyId),
  ]);

  return (
    <>
      <ContractorSummaryMetrics
        assignments={assignments}
        bids={bids}
        opportunities={opportunities}
      />
      <ContractorNavigationPanel />
    </>
  );
}
