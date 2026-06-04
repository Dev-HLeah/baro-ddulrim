import Link from "next/link";
import { Building2, Clock3, FileCheck2, Hammer, TimerReset } from "lucide-react";
import {
  getContractorBids,
  getContractorCompanies,
  getContractorOpportunities
} from "@/lib/contractor-api";
import {
  bidStatusLabels,
  formatCurrency,
  formatDateTime,
  issueTypeLabels,
  labelOf,
  statusLabels,
  urgencyLabels
} from "@/lib/labels";
import { submitContractorBidAction } from "./actions";

export const dynamic = "force-dynamic";

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

export default async function ContractorPage({
  searchParams
}: {
  searchParams: Promise<{ companyId?: string }>;
}) {
  const params = await searchParams;
  const companies = await getContractorCompanies();
  const selectedCompany =
    companies.find((company) => company.id === params.companyId) ?? companies[0] ?? null;
  const [opportunities, bids] = selectedCompany
    ? await Promise.all([
        getContractorOpportunities(selectedCompany.id),
        getContractorBids(selectedCompany.id)
      ])
    : [[], []];
  const submittedBidCount = opportunities.filter((opportunity) => opportunity.myBid).length;
  const selectedBidCount = bids.filter((bid) => bid.status === "SELECTED").length;

  return (
    <main className="workspace-page contractor-page">
      <header className="workspace-header">
        <p className="eyebrow">업체</p>
        <h1>입찰 작업대</h1>
      </header>

      {companies.length > 0 ? (
        <section className="contractor-company-list" aria-label="업체 선택">
          {companies.map((company) => (
            <Link
              className={`company-switch-card ${company.id === selectedCompany?.id ? "active" : ""}`}
              href={`/contractor?companyId=${company.id}`}
              key={company.id}
            >
              <Building2 aria-hidden="true" size={18} />
              <span>{company.companyName}</span>
              <small>
                {company.serviceRegions.join(", ")}
                {company.serviceRadiusKm ? ` · ${company.serviceRadiusKm}km` : ""}
              </small>
            </Link>
          ))}
        </section>
      ) : (
        <section className="panel-section">
          <p className="empty-text">승인된 업체가 없습니다.</p>
        </section>
      )}

      {selectedCompany ? (
        <>
          <section className="dashboard-grid compact">
            <article className="metric">
              <TimerReset aria-hidden="true" size={20} />
              <span>입찰 가능</span>
              <strong>{opportunities.length}</strong>
            </article>
            <article className="metric">
              <Clock3 aria-hidden="true" size={20} />
              <span>내 입찰</span>
              <strong>{submittedBidCount}</strong>
            </article>
            <article className="metric">
              <Hammer aria-hidden="true" size={20} />
              <span>선택 입찰</span>
              <strong>{selectedBidCount}</strong>
            </article>
            <article className="metric">
              <FileCheck2 aria-hidden="true" size={20} />
              <span>전체 제출</span>
              <strong>{bids.length}</strong>
            </article>
          </section>

          <section className="panel-section">
            <div className="section-header">
              <div>
                <p className="eyebrow">{selectedCompany.companyName}</p>
                <h2>입찰 가능한 신고</h2>
              </div>
              <span className="status-badge">{labelOf(statusLabels, "BIDDING")}</span>
            </div>

            <div className="opportunity-grid">
              {opportunities.map((opportunity) => {
                const submitBid = submitContractorBidAction.bind(
                  null,
                  selectedCompany.id,
                  opportunity.id
                );

                return (
                  <article className="opportunity-card" key={opportunity.id}>
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
                        <dd>{opportunity.placeName ?? opportunity.roadAddressText ?? "-"}</dd>
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
                    <form action={submitBid} className="admin-form compact-form">
                      <div className="form-grid">
                        <label className="form-field">
                          <span>견적 금액</span>
                          <input
                            inputMode="numeric"
                            name="estimatedPrice"
                            placeholder="160000"
                            defaultValue={opportunity.myBid?.estimatedPrice?.toString() ?? ""}
                          />
                        </label>
                        <label className="form-field">
                          <span>출동 가능 시간</span>
                          <input
                            name="availableTime"
                            type="datetime-local"
                            defaultValue={toDatetimeLocal(opportunity.myBid?.availableTime)}
                          />
                        </label>
                      </div>
                      <label className="form-field">
                        <span>작업 메모</span>
                        <textarea
                          name="workNote"
                          defaultValue={opportunity.myBid?.workNote ?? ""}
                          placeholder="출동 가능 시간, 장비, 작업 범위를 적어주세요."
                        />
                      </label>
                      <label className="form-field">
                        <span>추가 비용 조건</span>
                        <input
                          name="extraCostPolicy"
                          defaultValue={opportunity.myBid?.extraCostPolicy ?? ""}
                          placeholder="현장 확인 후 추가 비용 협의"
                        />
                      </label>
                      <div className="action-row">
                        <button className="primary-button" type="submit">
                          {opportunity.myBid ? "입찰 수정" : "입찰 제출"}
                        </button>
                      </div>
                    </form>
                  </article>
                );
              })}
              {opportunities.length === 0 ? (
                <p className="empty-text">현재 입찰 가능한 신고가 없습니다.</p>
              ) : null}
            </div>
          </section>

          <section className="panel-section">
            <div className="section-header">
              <div>
                <p className="eyebrow">히스토리</p>
                <h2>내 입찰 현황</h2>
              </div>
            </div>
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>접수번호</th>
                    <th>신고</th>
                    <th>상태</th>
                    <th>견적</th>
                    <th>출동 가능</th>
                    <th>제출</th>
                  </tr>
                </thead>
                <tbody>
                  {bids.map((bid) => (
                    <tr key={bid.id}>
                      <td>
                        <span className="table-link">{bid.report.reportNo}</span>
                      </td>
                      <td>
                        <strong>{bid.report.summary ?? "-"}</strong>
                        <span>{bid.report.placeName ?? bid.report.addressText ?? "-"}</span>
                      </td>
                      <td>
                        <span className="status-badge">{labelOf(bidStatusLabels, bid.status)}</span>
                        <span>{labelOf(statusLabels, bid.report.status)}</span>
                      </td>
                      <td>{formatCurrency(bid.estimatedPrice)}</td>
                      <td>{formatDateTime(bid.availableTime)}</td>
                      <td>{formatDateTime(bid.submittedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {bids.length === 0 ? <p className="empty-text">아직 제출한 입찰이 없습니다.</p> : null}
            </div>
          </section>
        </>
      ) : null}
    </main>
  );
}
