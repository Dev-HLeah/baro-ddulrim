import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { getReports } from "@/lib/admin-api";
import {
  channelLabels,
  formatCurrency,
  formatDateTime,
  issueTypeLabels,
  labelOf,
  statusLabels,
  urgencyLabels
} from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const reports = await getReports();

  return (
    <AdminShell>
      <header className="workspace-header">
        <p className="eyebrow">신고 관리</p>
        <h1>신고 목록</h1>
      </header>

      <section className="filter-strip" aria-label="신고 요약">
        <span>전체 {reports.length}건</span>
        <span>검수중 {reports.filter((report) => report.status === "ADMIN_REVIEW").length}건</span>
        <span>입찰중 {reports.filter((report) => report.status === "BIDDING").length}건</span>
        <span>해결 {reports.filter((report) => report.status === "RESOLVED").length}건</span>
      </section>

      <section className="panel-section">
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>접수번호</th>
                <th>신고 내용</th>
                <th>위치</th>
                <th>상태</th>
                <th>입찰</th>
                <th>최저 견적</th>
                <th>접수 시각</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id}>
                  <td>
                    <Link className="table-link" href={`/admin/reports/${report.reportNo}`}>
                      {report.reportNo}
                    </Link>
                    <span>{labelOf(channelLabels, report.channel)}</span>
                  </td>
                  <td>
                    <strong>{report.summary ?? "요약 없음"}</strong>
                    <span>
                      {labelOf(issueTypeLabels, report.issueType)} ·{" "}
                      {labelOf(urgencyLabels, report.urgency)}
                    </span>
                  </td>
                  <td>
                    <strong>{report.placeName ?? "-"}</strong>
                    <span>{report.roadAddressText ?? report.addressText ?? "-"}</span>
                  </td>
                  <td>
                    <span className="status-badge">{labelOf(statusLabels, report.status)}</span>
                  </td>
                  <td>{report.bidCount}건</td>
                  <td>{formatCurrency(report.minEstimatedPrice)}</td>
                  <td>{formatDateTime(report.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
