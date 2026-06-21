import Link from "next/link";
import { ContractorRegistrationForm } from "@/components/contractor-sections";

export const dynamic = "force-dynamic";

export default async function ContractorRegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="workspace-page contractor-page">
      <header className="workspace-header">
        <p className="eyebrow">업체</p>
        <h1>업체 등록 신청</h1>
      </header>

      <div className="action-row split-actions">
        <Link className="secondary-button" href="/">
          업체 작업대
        </Link>
      </div>

      <ContractorRegistrationForm registered={params.registered === "1"} />
    </main>
  );
}
