import Link from "next/link";
import { FileSearch, KeyRound } from "lucide-react";
import { CustomerReportCard } from "@/components/customer-report-card";
import { getCustomerReportByVerification } from "@/lib/customer-api";

export default async function CustomerReportDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ reportNo: string }>;
  searchParams: Promise<{ verificationCode?: string }>;
}) {
  const { reportNo } = await params;
  const { verificationCode } = await searchParams;
  const report = await getCustomerReportByVerification(
    reportNo,
    verificationCode,
  );

  return (
    <main className="shell customer-detail-shell">
      <section
        className="customer-panel"
        aria-labelledby="customer-report-title"
      >
        <div className="brand-row">
          <div className="brand-mark">바</div>
          <div>
            <p className="eyebrow">{reportNo}</p>
            <h1 id="customer-report-title">신고 상세</h1>
          </div>
        </div>

        <div className="mode-tabs" aria-label="신고 모드">
          <Link className="mode-tab" href="/report/new">
            신규 신고
          </Link>
          <Link className="mode-tab active" href="/report/lookup">
            내 신고 확인
          </Link>
        </div>

        {report ? (
          <CustomerReportCard report={report} />
        ) : (
          <form className="lookup-form verification-panel">
            <label htmlFor="verificationCode">확인번호</label>
            <div className="input-row">
              <KeyRound aria-hidden="true" size={18} />
              <input
                autoFocus
                defaultValue={verificationCode ?? ""}
                id="verificationCode"
                name="verificationCode"
                placeholder="345678"
              />
            </div>
            <button className="secondary-button" type="submit">
              <FileSearch aria-hidden="true" size={16} />
              상세 확인
            </button>
          </form>
        )}
      </section>

      <aside className="ops-panel" aria-label="신고 조회">
        <div className="timeline-card">
          <h2>다른 신고 조회</h2>
          <Link className="secondary-button" href="/report/lookup">
            <FileSearch aria-hidden="true" size={16} />
            조회 화면으로 이동
          </Link>
        </div>
      </aside>
    </main>
  );
}
