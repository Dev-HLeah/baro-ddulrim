import { ClipboardList, ShieldCheck } from "lucide-react";
import { CustomerLookup } from "@/components/customer-lookup";
import { CustomerReportCard } from "@/components/customer-report-card";
import {
  getCustomerReportByVerification,
  getCustomerReportsByPhone,
} from "@/lib/customer-api";

export const dynamic = "force-dynamic";

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
    <CustomerLookup
      initialCode={params.verificationCode}
      initialPhone={params.lookupPhone}
      initialReportNo={params.reportNo}
    >
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
    </CustomerLookup>
  );
}
