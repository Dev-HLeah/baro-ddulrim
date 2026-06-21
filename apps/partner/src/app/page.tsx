import {
  ContractorNavigationPanel,
  ContractorNoCompanyScreen,
  ContractorRejectedScreen,
  ContractorSummaryMetrics,
  ContractorWaitingScreen,
} from "@/components/contractor-sections";
import {
  getContractorAssignments,
  getContractorBids,
  getContractorOpportunities,
} from "@/lib/contractor-api";
import { isApprovedCompany, loadMyCompany } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ContractorPage() {
  const company = await loadMyCompany();

  return (
    <main className="workspace-page contractor-page">
      <header className="workspace-header">
        <p className="eyebrow">업체</p>
        <h1>업체 작업대</h1>
      </header>

      {!company ? (
        <ContractorNoCompanyScreen />
      ) : company.status === "REJECTED" ? (
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
