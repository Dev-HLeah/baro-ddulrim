import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { getReport } from "@/lib/admin-api";
import {
  actorLabels,
  channelLabels,
  formatCurrency,
  formatDateTime,
  issueTypeLabels,
  labelOf,
  statusLabels,
  urgencyLabels
} from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function AdminReportDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const report = await getReport(id);

  if (!report) {
    notFound();
  }

  const latestAi = report.aiAnalyses[0];

  return (
    <AdminShell>
      <div className="back-row">
        <Link className="text-link" href="/admin/reports">
          <ArrowLeft aria-hidden="true" size={16} />
          신고 목록
        </Link>
      </div>

      <header className="detail-header">
        <div>
          <p className="eyebrow">{report.reportNo}</p>
          <h1>{report.summary ?? "신고 상세"}</h1>
          <p>{report.description ?? "상세 설명이 없습니다."}</p>
        </div>
        <div className="header-badges">
          <span className="status-badge">{labelOf(statusLabels, report.status)}</span>
          <span className={`urgency-badge ${report.urgency.toLowerCase()}`}>
            {labelOf(urgencyLabels, report.urgency)}
          </span>
        </div>
      </header>

      <section className="detail-grid">
        <article className="panel-section">
          <h2>신고 정보</h2>
          <dl className="info-list">
            <div>
              <dt>연락처</dt>
              <dd>{report.customerPhone}</dd>
            </div>
            <div>
              <dt>채널</dt>
              <dd>{labelOf(channelLabels, report.channel)}</dd>
            </div>
            <div>
              <dt>유형</dt>
              <dd>{labelOf(issueTypeLabels, report.issueType)}</dd>
            </div>
            <div>
              <dt>접수 시각</dt>
              <dd>{formatDateTime(report.createdAt)}</dd>
            </div>
            <div>
              <dt>배정 업체</dt>
              <dd>{report.assignedCompanyName ?? "-"}</dd>
            </div>
          </dl>
        </article>

        <article className="panel-section">
          <h2>위치</h2>
          <div className="location-box">
            <MapPin aria-hidden="true" size={20} />
            <div>
              <strong>{report.placeName ?? report.addressText ?? "-"}</strong>
              <span>{report.roadAddressText ?? report.addressText ?? "-"}</span>
              <small>
                {report.latitude && report.longitude
                  ? `${report.latitude}, ${report.longitude}`
                  : "좌표 없음"}
              </small>
            </div>
          </div>
        </article>
      </section>

      <section className="detail-grid">
        <article className="panel-section">
          <h2>AI 분석</h2>
          {latestAi ? (
            <div className="ai-box">
              <div className="ai-score">
                <span>{latestAi.provider}</span>
                <strong>{latestAi.confidence ? `${Math.round(latestAi.confidence * 100)}%` : "-"}</strong>
              </div>
              <p>{latestAi.vendorDescription ?? latestAi.summary ?? "분석 설명이 없습니다."}</p>
              <div className="tag-row">
                <span>{latestAi.model}</span>
                <span>{latestAi.needsReview ? "관리자 확인 필요" : "확인 완료"}</span>
              </div>
            </div>
          ) : (
            <p className="empty-text">AI 분석 결과가 없습니다.</p>
          )}
        </article>

        <article className="panel-section">
          <h2>배정 결과</h2>
          {report.assignment ? (
            <div className="assignment-box">
              <strong>{report.assignment.contractorCompanyName}</strong>
              <span>{formatDateTime(report.assignment.assignedAt)}</span>
              <p>{report.assignment.selectionReason ?? "선택 사유 없음"}</p>
              <small>{report.assignment.customerMessageRendered}</small>
            </div>
          ) : (
            <p className="empty-text">아직 배정된 업체가 없습니다.</p>
          )}
        </article>
      </section>

      <section className="panel-section">
        <div className="section-header">
          <div>
            <p className="eyebrow">업체</p>
            <h2>입찰 목록</h2>
          </div>
        </div>
        <div className="bid-grid">
          {report.bids.map((bid) => (
            <article className="bid-card" key={bid.id}>
              <div>
                <strong>{bid.contractorCompanyName}</strong>
                <span className="status-badge">{bid.status}</span>
              </div>
              <dl className="info-list compact-list">
                <div>
                  <dt>견적</dt>
                  <dd>{formatCurrency(bid.estimatedPrice)}</dd>
                </div>
                <div>
                  <dt>출동 가능</dt>
                  <dd>{formatDateTime(bid.availableTime)}</dd>
                </div>
              </dl>
              <p>{bid.workNote ?? "작업 메모 없음"}</p>
              <small>{bid.extraCostPolicy ?? "추가 비용 조건 없음"}</small>
            </article>
          ))}
          {report.bids.length === 0 ? <p className="empty-text">입찰 내역이 없습니다.</p> : null}
        </div>
      </section>

      <section className="detail-grid">
        <article className="panel-section">
          <h2>상담 기록</h2>
          <div className="message-thread">
            {report.messages.map((message) => (
              <div className="message-row" key={message.id}>
                <span>{labelOf(actorLabels, message.senderType)}</span>
                <p>{message.content}</p>
                <small>{formatDateTime(message.createdAt)}</small>
              </div>
            ))}
          </div>
        </article>

        <article className="panel-section">
          <h2>상태 이력</h2>
          <div className="timeline">
            {report.statusHistory.map((history) => (
              <div className="timeline-entry" key={history.id}>
                <span>{formatDateTime(history.createdAt)}</span>
                <strong>{labelOf(statusLabels, history.toStatus)}</strong>
                <p>
                  {labelOf(actorLabels, history.actorType)} · {history.reason ?? "-"}
                </p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="panel-section">
        <h2>작업 이력</h2>
        <div className="timeline">
          {report.workUpdates.map((update) => (
            <div className="timeline-entry" key={update.id}>
              <span>{formatDateTime(update.createdAt)}</span>
              <strong>{labelOf(statusLabels, update.status)}</strong>
              <p>
                {update.contractorCompanyName} · {update.note ?? "-"} ·{" "}
                {formatCurrency(update.finalPrice)}
              </p>
            </div>
          ))}
          {report.workUpdates.length === 0 ? <p className="empty-text">작업 이력이 없습니다.</p> : null}
        </div>
      </section>
    </AdminShell>
  );
}
