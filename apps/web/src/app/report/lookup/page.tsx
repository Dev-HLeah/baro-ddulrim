import Link from "next/link";
import {
  ClipboardList,
  FileSearch,
  KeyRound,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { CustomerReportCard } from "@/components/customer-report-card";
import {
  getCustomerReportByVerification,
  getCustomerReportsByPhone,
} from "@/lib/customer-api";

export default async function ReportLookupPage({
  searchParams,
}: {
  searchParams: Promise<{
    lookupPhone?: string;
    reportNo?: string;
    verificationCode?: string;
  }>;
}) {
  const params = await searchParams;
  const [phoneReports, verifiedReport] = await Promise.all([
    getCustomerReportsByPhone(params.lookupPhone),
    getCustomerReportByVerification(params.reportNo, params.verificationCode),
  ]);
  const reports = verifiedReport ? [verifiedReport] : phoneReports;
  const hasSearched = Boolean(
    params.lookupPhone?.trim() ||
    (params.reportNo?.trim() && params.verificationCode?.trim()),
  );

  return (
    <main className="shell">
      <section className="customer-panel" aria-labelledby="lookup-title">
        <div className="brand-row">
          <div>
            <p className="eyebrow">바로 뚫림</p>
            <h1 id="lookup-title">내 신고 확인</h1>
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

        <div className="customer-lookup-stack">
          <form className="lookup-form">
            <label htmlFor="lookupPhone">연락처로 조회</label>
            <div className="input-row">
              <Phone aria-hidden="true" size={18} />
              <input
                defaultValue={params.lookupPhone ?? ""}
                id="lookupPhone"
                name="lookupPhone"
                placeholder="010-1000-2000"
                type="tel"
              />
            </div>
            <button className="secondary-button" type="submit">
              <FileSearch aria-hidden="true" size={16} />
              조회
            </button>
          </form>

          <form className="lookup-form">
            <label htmlFor="reportNo">접수번호 + 확인번호</label>
            <div className="input-row">
              <FileSearch aria-hidden="true" size={18} />
              <input
                defaultValue={params.reportNo ?? ""}
                id="reportNo"
                name="reportNo"
                placeholder="BD-SEED-003"
              />
            </div>
            <div className="input-row">
              <KeyRound aria-hidden="true" size={18} />
              <input
                aria-label="확인번호"
                defaultValue={params.verificationCode ?? ""}
                id="verificationCode"
                name="verificationCode"
                placeholder="345678"
              />
            </div>
            <button className="secondary-button" type="submit">
              확인
            </button>
          </form>
        </div>
      </section>

      <aside className="ops-panel" aria-label="조회 결과">
        <div className="status-grid">
          <div className="metric">
            <ClipboardList aria-hidden="true" size={20} />
            <span>조회 결과</span>
            <strong>{reports.length}</strong>
          </div>
          <div className="metric">
            <ShieldCheck aria-hidden="true" size={20} />
            <span>해결 완료</span>
            <strong>
              {reports.filter((report) => report.status === "RESOLVED").length}
            </strong>
          </div>
        </div>

        <div className="customer-results">
          {reports.map((report) => (
            <CustomerReportCard key={report.id} report={report} />
          ))}
          {hasSearched && reports.length === 0 ? (
            <p className="empty-text">조회된 신고가 없습니다.</p>
          ) : null}
          {!hasSearched ? (
            <p className="empty-text">
              연락처를 입력하면 접수했던 신고 목록을 확인할 수 있습니다.
            </p>
          ) : null}
        </div>
      </aside>
    </main>
  );
}
