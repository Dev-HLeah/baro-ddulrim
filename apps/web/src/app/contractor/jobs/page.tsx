import Link from "next/link";
import {
  ContractorAssignmentsSection,
  ContractorCompanySelector,
  ContractorSummaryMetrics,
} from "@/components/contractor-sections";
import {
  getContractorAssignments,
  getContractorBids,
  getContractorCompanies,
  getContractorOpportunities,
} from "@/lib/contractor-api";

export const dynamic = "force-dynamic";

export default async function ContractorJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ companyId?: string }>;
}) {
  const params = await searchParams;
  const companies = await getContractorCompanies();
  const selectedCompany =
    companies.find((company) => company.id === params.companyId) ??
    companies[0] ??
    null;
  const [opportunities, bids, assignments] = selectedCompany
    ? await Promise.all([
        getContractorOpportunities(selectedCompany.id),
        getContractorBids(selectedCompany.id),
        getContractorAssignments(selectedCompany.id),
      ])
    : [[], [], []];

  return (
    <main className="workspace-page contractor-page">
      <header className="workspace-header">
        <p className="eyebrow">업체</p>
        <h1>배정 작업</h1>
      </header>

      <div className="action-row split-actions">
        <Link className="secondary-button" href="/contractor">
          작업대 홈
        </Link>
        {selectedCompany ? (
          <Link
            className="secondary-button"
            href={`/contractor/bids?companyId=${encodeURIComponent(selectedCompany.id)}`}
          >
            입찰 관리
          </Link>
        ) : null}
      </div>

      <ContractorCompanySelector
        basePath="/contractor/jobs"
        companies={companies}
        selectedCompany={selectedCompany}
      />

      {selectedCompany ? (
        <>
          <ContractorSummaryMetrics
            assignments={assignments}
            bids={bids}
            opportunities={opportunities}
          />
          <ContractorAssignmentsSection
            assignments={assignments}
            selectedCompany={selectedCompany}
          />
        </>
      ) : null}
    </main>
  );
}
