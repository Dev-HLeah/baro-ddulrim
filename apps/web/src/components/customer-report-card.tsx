import type { CustomerReport } from "@/lib/customer-api";
import {
  actorLabels,
  formatCurrency,
  formatDateTime,
  issueTypeLabels,
  labelOf,
  statusLabels,
  urgencyLabels,
} from "@/lib/labels";

export function CustomerReportCard({ report }: { report: CustomerReport }) {
  return (
    <article className="customer-report-card">
      <div className="opportunity-head">
        <div>
          <span className="table-link">{report.reportNo}</span>
          <h3>{report.summary ?? "신고 요약 없음"}</h3>
        </div>
        <span className="status-badge">
          {labelOf(statusLabels, report.status)}
        </span>
      </div>
      <dl className="info-list compact-list">
        <div>
          <dt>접수</dt>
          <dd>{formatDateTime(report.createdAt)}</dd>
        </div>
        <div>
          <dt>유형</dt>
          <dd>{labelOf(issueTypeLabels, report.issueType)}</dd>
        </div>
        <div>
          <dt>긴급도</dt>
          <dd>{labelOf(urgencyLabels, report.urgency)}</dd>
        </div>
        <div>
          <dt>위치</dt>
          <dd>
            {report.placeName ??
              report.roadAddressText ??
              report.addressText ??
              "-"}
          </dd>
        </div>
      </dl>
      {report.assignment ? (
        <div className="customer-assignment-box">
          <strong>{report.assignment.contractorCompanyName}</strong>
          <span>{formatCurrency(report.assignment.estimatedPrice)}</span>
          <small>{report.assignment.customerMessageRendered}</small>
        </div>
      ) : null}
      <div className="customer-progress-list">
        {report.statusHistory.map((history) => (
          <div className="customer-progress-entry" key={history.id}>
            <span>{formatDateTime(history.createdAt)}</span>
            <strong>{labelOf(statusLabels, history.toStatus)}</strong>
            <small>
              {labelOf(actorLabels, history.actorType)} ·{" "}
              {history.reason ?? "-"}
            </small>
          </div>
        ))}
        {report.workUpdates.map((update) => (
          <div className="customer-progress-entry" key={update.id}>
            <span>{formatDateTime(update.createdAt)}</span>
            <strong>{labelOf(statusLabels, update.status)}</strong>
            <small>
              {update.contractorCompanyName} · {update.note ?? "-"}
              {update.finalPrice
                ? ` · ${formatCurrency(update.finalPrice)}`
                : ""}
            </small>
          </div>
        ))}
      </div>
    </article>
  );
}
