import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ContractorAssignmentsSection,
  ContractorSummaryMetrics,
} from "@/components/contractor-sections";
import {
  getContractorAssignments,
  getContractorBids,
  getContractorOpportunities,
} from "@/lib/contractor-api";
import { isApprovedCompany, loadMyContext } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ContractorJobsPage() {
  const context = await loadMyContext();
  const company = context?.company ?? null;

  if (!company || !isApprovedCompany(company)) {
    redirect("/");
  }

  const [opportunities, bids, assignments] = await Promise.all([
    getContractorOpportunities(company.id),
    getContractorBids(company.id),
    getContractorAssignments(company.id),
  ]);

  return (
    <main className="workspace-page contractor-page">
      <header className="workspace-header">
        <p className="eyebrow">업체</p>
        <h1>배정 작업</h1>
      </header>

      <div className="action-row split-actions">
        <Link className="secondary-button" href="/">
          작업대 홈
        </Link>
        <Link className="secondary-button" href="/bids">
          입찰 관리
        </Link>
      </div>

      <ContractorSummaryMetrics
        assignments={assignments}
        bids={bids}
        opportunities={opportunities}
      />
      <ContractorAssignmentsSection
        assignments={assignments}
        selectedCompany={company}
      />
    </main>
  );
}
