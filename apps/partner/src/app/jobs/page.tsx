import { redirect } from "next/navigation";
import { ContractorAssignmentsSection } from "@/components/contractor-sections";
import { ContractorShell } from "@/components/contractor-shell";
import { getContractorAssignments } from "@/lib/contractor-api";
import { isApprovedCompany, loadMyContext } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ContractorJobsPage() {
  const context = await loadMyContext();
  const company = context?.company ?? null;

  if (!company || !isApprovedCompany(company)) {
    redirect("/");
  }

  const assignments = await getContractorAssignments(company.id);

  return (
    <main className="workspace-page contractor-page">
      <header className="workspace-header">
        <p className="eyebrow">업체</p>
        <h1>배정 작업</h1>
      </header>

      <ContractorShell>
        <ContractorAssignmentsSection
          assignments={assignments}
          selectedCompany={company}
        />
      </ContractorShell>
    </main>
  );
}
