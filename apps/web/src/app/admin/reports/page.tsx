import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { getReports, type ReportListItem } from "@/lib/admin-api";
import {
  channelLabels,
  formatCurrency,
  formatDateTime,
  issueTypeLabels,
  labelOf,
  statusLabels,
  statusTone,
  urgencyLabels
} from "@/lib/labels";

export const dynamic = "force-dynamic";

const statusFilters = [
  { key: "all", label: "전체", statuses: null },
  {
    key: "review",
    label: "검수중",
    statuses: [
      "COLLECTING_INFO",
      "AI_ANALYZED",
      "ADMIN_REVIEW",
      "CUSTOMER_INFO_REQUIRED"
    ]
  },
  { key: "bidding", label: "입찰중", statuses: ["APPROVED_FOR_BIDDING", "BIDDING"] },
  {
    key: "working",
    label: "작업중",
    statuses: ["ASSIGNED", "DISPATCH_SCHEDULED", "DISPATCHED", "IN_PROGRESS"]
  },
  { key: "resolved", label: "해결", statuses: ["RESOLVED"] }
] as const;

type StatusFilterKey = (typeof statusFilters)[number]["key"];

function matchesStatus(report: ReportListItem, filterKey: StatusFilterKey) {
  const filter = statusFilters.find((entry) => entry.key === filterKey);

  if (!filter || filter.statuses === null) {
    return true;
  }

  return (filter.statuses as readonly string[]).includes(report.status);
}

function matchesDateRange(report: ReportListItem, from?: string, to?: string) {
  if (!report.createdAt) {
    return !from && !to;
  }

  const createdAt = new Date(report.createdAt).getTime();

  if (from) {
    const fromTime = new Date(`${from}T00:00:00`).getTime();

    if (Number.isFinite(fromTime) && createdAt < fromTime) {
      return false;
    }
  }

  if (to) {
    const toTime = new Date(`${to}T23:59:59.999`).getTime();

    if (Number.isFinite(toTime) && createdAt > toTime) {
      return false;
    }
  }

  return true;
}

function buildQuery(params: { status?: string; from?: string; to?: string }) {
  const query = new URLSearchParams();

  if (params.status && params.status !== "all") {
    query.set("status", params.status);
  }

  if (params.from) {
    query.set("from", params.from);
  }

  if (params.to) {
    query.set("to", params.to);
  }

  const text = query.toString();
  return text ? `?${text}` : "";
}

export default async function AdminReportsPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const activeFilter: StatusFilterKey = statusFilters.some(
    (entry) => entry.key === params.status
  )
    ? (params.status as StatusFilterKey)
    : "all";
  const from = params.from?.trim() || undefined;
  const to = params.to?.trim() || undefined;

  const reports = await getReports();
  const dateFiltered = reports.filter((report) =>
    matchesDateRange(report, from, to)
  );
  const visibleReports = dateFiltered.filter((report) =>
    matchesStatus(report, activeFilter)
  );

  return (
    <AdminShell>
      <header className="workspace-header">
        <p className="eyebrow">신고 관리</p>
        <h1>신고 목록</h1>
      </header>

      <section className="filter-strip" aria-label="상태 필터">
        {statusFilters.map((filter) => {
          const count = dateFiltered.filter((report) =>
            matchesStatus(report, filter.key)
          ).length;

          return (
            <Link
              className={`filter-chip${activeFilter === filter.key ? " active" : ""}`}
              href={`/admin/reports${buildQuery({ status: filter.key, from, to })}`}
              key={filter.key}
            >
              {filter.label} {count}건
            </Link>
          );
        })}
      </section>

      <form className="date-filter-bar" method="get">
        {activeFilter !== "all" ? (
          <input name="status" type="hidden" value={activeFilter} />
        ) : null}
        <label>
          <span>시작일</span>
          <input defaultValue={from ?? ""} name="from" type="date" />
        </label>
        <label>
          <span>종료일</span>
          <input defaultValue={to ?? ""} name="to" type="date" />
        </label>
        <button className="secondary-button" type="submit">
          기간 적용
        </button>
        {from || to ? (
          <Link
            aria-label="기간 초기화"
            className="icon-link"
            href={`/admin/reports${buildQuery({ status: activeFilter })}`}
            title="기간 초기화"
          >
            <RotateCcw aria-hidden="true" size={18} />
          </Link>
        ) : null}
      </form>

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
              {visibleReports.map((report) => (
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
                    <span className={`status-badge ${statusTone(report.status)}`}>
                      {labelOf(statusLabels, report.status)}
                    </span>
                  </td>
                  <td>{report.bidCount}건</td>
                  <td>{formatCurrency(report.minEstimatedPrice)}</td>
                  <td>{formatDateTime(report.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {visibleReports.length === 0 ? (
            <p className="empty-text">조건에 맞는 신고가 없습니다.</p>
          ) : null}
        </div>
      </section>
    </AdminShell>
  );
}
