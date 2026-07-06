import { redirect } from "next/navigation";
import { BidWorkspace } from "@/components/bid-workspace";
import { ContractorShell } from "@/components/contractor-shell";
import { getContractorOpportunities } from "@/lib/contractor-api";
import { isApprovedCompany, loadMyContext } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ContractorBidsPage() {
  const context = await loadMyContext();
  const company = context?.company ?? null;

  if (!company || !isApprovedCompany(company)) {
    redirect("/");
  }

  const opportunities = await getContractorOpportunities(company.id);

  return (
    <main className="workspace-page contractor-page">
      <header className="workspace-header">
        <p className="eyebrow">업체</p>
        <h1>입찰</h1>
      </header>

      <ContractorShell>
        <BidWorkspace companyId={company.id} opportunities={opportunities} />
      </ContractorShell>
    </main>
  );
}
