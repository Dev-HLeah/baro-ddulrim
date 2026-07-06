"use client";

import { useMemo, useState } from "react";
import { MapPin, RotateCcw } from "lucide-react";
import { submitContractorBidAction } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";
import type { ContractorOpportunity } from "@/lib/contractor-api";
import {
  bidStatusLabels,
  formatCurrency,
  formatDateTime,
  issueTypeLabels,
  labelOf,
  urgencyLabels,
} from "@/lib/labels";

function toDatetimeLocal(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function opportunityRegionText(opportunity: ContractorOpportunity) {
  return [
    opportunity.placeName,
    opportunity.roadAddressText,
    opportunity.addressText,
  ]
    .filter(Boolean)
    .join(" ");
}

/** 입찰 가능한 신고 — 왼쪽 리스트에서 고르고 오른쪽에서 입찰한다. */
export function BidWorkspace({
  companyId,
  opportunities,
}: {
  companyId: string;
  opportunities: ContractorOpportunity[];
}) {
  const [region, setRegion] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(
    opportunities[0]?.id ?? null,
  );

  const filtered = useMemo(() => {
    const keyword = region.trim().toLowerCase();
    const fromTime = from ? new Date(`${from}T00:00:00`).getTime() : null;
    const toTime = to ? new Date(`${to}T23:59:59.999`).getTime() : null;

    return opportunities.filter((opportunity) => {
      if (
        keyword &&
        !opportunityRegionText(opportunity).toLowerCase().includes(keyword)
      ) {
        return false;
      }

      const baseDate = opportunity.adminApprovedAt ?? opportunity.createdAt;
      const time = baseDate ? new Date(baseDate).getTime() : NaN;

      if (fromTime !== null && (Number.isNaN(time) || time < fromTime)) {
        return false;
      }

      if (toTime !== null && (Number.isNaN(time) || time > toTime)) {
        return false;
      }

      return true;
    });
  }, [from, opportunities, region, to]);

  const selected =
    filtered.find((opportunity) => opportunity.id === selectedId) ??
    filtered[0] ??
    null;

  return (
    <section className="panel-section">
      <div className="section-header">
        <div>
          <p className="eyebrow">입찰</p>
          <h2>입찰 가능한 신고</h2>
        </div>
        <span className="status-badge">{filtered.length}건</span>
      </div>

      <div className="bid-filter-bar">
        <label>
          <span>지역 검색</span>
          <input
            onChange={(event) => setRegion(event.target.value)}
            placeholder="예: 분당, 강남, 오피스텔"
            value={region}
          />
        </label>
        <label>
          <span>시작일</span>
          <input
            onChange={(event) => setFrom(event.target.value)}
            type="date"
            value={from}
          />
        </label>
        <label>
          <span>종료일</span>
          <input
            onChange={(event) => setTo(event.target.value)}
            type="date"
            value={to}
          />
        </label>
        <button
          aria-label="검색 초기화"
          className="icon-link"
          onClick={() => {
            setRegion("");
            setFrom("");
            setTo("");
          }}
          title="검색 초기화"
          type="button"
        >
          <RotateCcw aria-hidden="true" size={18} />
        </button>
      </div>

      <div className="bid-workspace">
        <aside aria-label="입찰 가능한 신고 목록" className="bid-list">
          {filtered.map((opportunity) => (
            <button
              className={`bid-list-item${selected?.id === opportunity.id ? " active" : ""}`}
              key={opportunity.id}
              onClick={() => setSelectedId(opportunity.id)}
              type="button"
            >
              <div className="bid-list-item-head">
                <span className="bid-list-no">{opportunity.reportNo}</span>
                <span
                  className={`urgency-badge ${opportunity.urgency.toLowerCase()}`}
                >
                  {labelOf(urgencyLabels, opportunity.urgency)}
                </span>
              </div>
              <strong>{opportunity.summary ?? "신고 요약 없음"}</strong>
              <small>
                <MapPin aria-hidden="true" size={12} />{" "}
                {opportunity.placeName ??
                  opportunity.roadAddressText ??
                  opportunity.addressText ??
                  "위치 미확인"}
              </small>
              <small>
                입찰 {opportunity.bidCount}건
                {opportunity.myBid
                  ? ` · 내 입찰 ${formatCurrency(opportunity.myBid.estimatedPrice)}`
                  : ""}
              </small>
            </button>
          ))}
          {filtered.length === 0 ? (
            <p className="empty-text">조건에 맞는 신고가 없습니다.</p>
          ) : null}
        </aside>

        <div className="bid-detail">
          {selected ? (
            <BidDetail companyId={companyId} opportunity={selected} />
          ) : (
            <p className="empty-text">
              왼쪽 목록에서 신고를 선택하면 입찰할 수 있습니다.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function BidDetail({
  companyId,
  opportunity,
}: {
  companyId: string;
  opportunity: ContractorOpportunity;
}) {
  const submitBid = submitContractorBidAction.bind(
    null,
    companyId,
    opportunity.id,
  );

  return (
    <article className="opportunity-card bid-detail-card">
      <div className="opportunity-head">
        <div>
          <span className="table-link">{opportunity.reportNo}</span>
          <h3>{opportunity.summary ?? "신고 요약 없음"}</h3>
        </div>
        <span className={`urgency-badge ${opportunity.urgency.toLowerCase()}`}>
          {labelOf(urgencyLabels, opportunity.urgency)}
        </span>
      </div>
      <dl className="info-list compact-list">
        <div>
          <dt>유형</dt>
          <dd>{labelOf(issueTypeLabels, opportunity.issueType)}</dd>
        </div>
        <div>
          <dt>위치</dt>
          <dd>
            {opportunity.placeName ??
              opportunity.roadAddressText ??
              opportunity.addressText ??
              "-"}
          </dd>
        </div>
        <div>
          <dt>입찰</dt>
          <dd>{opportunity.bidCount}건</dd>
        </div>
        <div>
          <dt>승인</dt>
          <dd>{formatDateTime(opportunity.adminApprovedAt)}</dd>
        </div>
      </dl>
      <p>{opportunity.description ?? "상세 내용이 없습니다."}</p>
      {opportunity.myBid ? (
        <div className="bid-inline-status">
          <span className="status-badge">
            {labelOf(bidStatusLabels, opportunity.myBid.status)}
          </span>
          <strong>{formatCurrency(opportunity.myBid.estimatedPrice)}</strong>
          <small>{formatDateTime(opportunity.myBid.availableTime)}</small>
        </div>
      ) : null}
      <form action={submitBid} className="admin-form compact-form" key={opportunity.id}>
        <div className="form-grid">
          <label className="form-field">
            <span>견적 금액</span>
            <input
              defaultValue={opportunity.myBid?.estimatedPrice?.toString() ?? ""}
              inputMode="numeric"
              name="estimatedPrice"
              placeholder="160000"
            />
          </label>
          <label className="form-field">
            <span>출동 가능 시간</span>
            <input
              defaultValue={toDatetimeLocal(opportunity.myBid?.availableTime)}
              name="availableTime"
              type="datetime-local"
            />
          </label>
        </div>
        <label className="form-field">
          <span>작업 메모</span>
          <textarea
            defaultValue={opportunity.myBid?.workNote ?? ""}
            name="workNote"
            placeholder="출동 가능 시간, 장비, 작업 범위를 적어주세요."
          />
        </label>
        <label className="form-field">
          <span>추가 비용 조건</span>
          <input
            defaultValue={opportunity.myBid?.extraCostPolicy ?? ""}
            name="extraCostPolicy"
            placeholder="현장 확인 후 추가 비용 협의"
          />
        </label>
        <div className="action-row">
          <SubmitButton className="primary-button" type="submit">
            {opportunity.myBid ? "입찰 수정" : "입찰 제출"}
          </SubmitButton>
        </div>
      </form>
    </article>
  );
}
