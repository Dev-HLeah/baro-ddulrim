import Link from "next/link";
import { Building2, Clock3, FileCheck2, Hammer, TimerReset } from "lucide-react";
import {
  getContractorAssignments,
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
import { registerContractorAction, submitContractorBidAction, submitWorkUpdateAction } from "./actions";

export const dynamic = "force-dynamic";

const workStatusOptions = ["DISPATCH_SCHEDULED", "DISPATCHED", "IN_PROGRESS", "RESOLVED"];

function nextWorkStatus(currentStatus: string | null) {
  if (currentStatus === "DISPATCH_SCHEDULED") {
    return "DISPATCHED";
  }

  if (currentStatus === "DISPATCHED") {
    return "IN_PROGRESS";
  }

  if (currentStatus === "IN_PROGRESS") {
    return "RESOLVED";
  }

  return currentStatus ?? "DISPATCH_SCHEDULED";
}

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
  searchParams: Promise<{ companyId?: string; registered?: string }>;
}) {
  const params = await searchParams;
  const companies = await getContractorCompanies();
  const selectedCompany =
    companies.find((company) => company.id === params.companyId) ?? companies[0] ?? null;
  const [opportunities, bids, assignments] = selectedCompany
    ? await Promise.all([
        getContractorOpportunities(selectedCompany.id),
        getContractorBids(selectedCompany.id),
        getContractorAssignments(selectedCompany.id)
      ])
    : [[], [], []];
  const submittedBidCount = opportunities.filter((opportunity) => opportunity.myBid).length;
  const completedAssignmentCount = assignments.filter(
    (assignment) => assignment.report.status === "RESOLVED"
  ).length;

  return (
    <main className="workspace-page contractor-page">
      <header className="workspace-header">
        <p className="eyebrow">업체</p>
        <h1>입찰 작업대</h1>
      </header>

      {params.registered === "1" ? (
        <section className="panel-section">
          <p className="empty-text">업체 등록 신청이 접수되었습니다. 관리자가 확인 후 승인합니다.</p>
        </section>
      ) : null}

      <section className="panel-section">
        <div className="section-header">
          <div>
            <p className="eyebrow">신규 업체</p>
            <h2>업체 등록 신청</h2>
          </div>
        </div>
        <form action={registerContractorAction} className="admin-form">
          <div className="form-grid">
            <label className="form-field">
              <span>담당자 이메일</span>
              <input name="email" placeholder="partner@example.com" required type="email" />
            </label>
            <label className="form-field">
              <span>담당자 이름</span>
              <input name="name" placeholder="홍길동" required />
            </label>
            <label className="form-field">
              <span>연락처</span>
              <input name="phone" placeholder="010-0000-0000" required type="tel" />
            </label>
            <label className="form-field">
              <span>업체명</span>
              <input name="companyName" placeholder="바로배관케어" required />
            </label>
            <label className="form-field">
              <span>대표자명</span>
              <input name="representativeName" placeholder="김대표" required />
            </label>
            <label className="form-field">
              <span>사업자 번호</span>
              <input name="businessNumber" placeholder="000-00-00000" required />
            </label>
            <label className="form-field">
              <span>주소</span>
              <input name="address" placeholder="서울시 강남구" />
            </label>
            <label className="form-field">
              <span>활동 반경(km)</span>
              <input inputMode="numeric" name="serviceRadiusKm" placeholder="20" />
            </label>
          </div>
          <label className="form-field">
            <span>활동 지역</span>
            <input name="serviceRegions" placeholder="서울, 경기 남부" required />
          </label>
          <label className="form-field textarea-field">
            <span>업체 소개</span>
            <textarea name="description" placeholder="보유 장비, 대응 가능 작업, 출동 가능 지역" />
          </label>
          <div className="form-grid">
            <label className="form-field">
              <span>사업자등록증</span>
              <input accept="image/*,application/pdf" name="businessLicense" type="file" />
            </label>
            <label className="form-field">
              <span>업체 사진</span>
              <input accept="image/*" name="companyPhoto" type="file" />
            </label>
          </div>
          <div className="action-row">
            <button className="primary-button" type="submit">
              등록 신청
            </button>
          </div>
        </form>
      </section>

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
              <span>배정 작업</span>
              <strong>{assignments.length}</strong>
            </article>
            <article className="metric">
              <FileCheck2 aria-hidden="true" size={20} />
              <span>완료 작업</span>
              <strong>{completedAssignmentCount}</strong>
            </article>
          </section>

          <section className="panel-section">
            <div className="section-header">
              <div>
                <p className="eyebrow">작업</p>
                <h2>배정 작업</h2>
              </div>
            </div>

            <div className="assignment-grid">
              {assignments.map((assignment) => {
                const submitWorkUpdate = submitWorkUpdateAction.bind(
                  null,
                  selectedCompany.id,
                  assignment.id
                );
                const latestFinalPrice =
                  assignment.workUpdates
                    .filter((update) => update.finalPrice != null)
                    .at(-1)?.finalPrice ?? null;

                return (
                  <article className="assignment-work-card" key={assignment.id}>
                    <div className="opportunity-head">
                      <div>
                        <span className="table-link">{assignment.report.reportNo}</span>
                        <h3>{assignment.report.summary ?? "배정 작업"}</h3>
                      </div>
                      <span className="status-badge">
                        {labelOf(statusLabels, assignment.report.status)}
                      </span>
                    </div>
                    <dl className="info-list compact-list">
                      <div>
                        <dt>위치</dt>
                        <dd>{assignment.report.placeName ?? assignment.report.roadAddressText ?? "-"}</dd>
                      </div>
                      <div>
                        <dt>견적</dt>
                        <dd>{formatCurrency(assignment.bid.estimatedPrice)}</dd>
                      </div>
                      <div>
                        <dt>배정</dt>
                        <dd>{formatDateTime(assignment.assignedAt)}</dd>
                      </div>
                      <div>
                        <dt>최근 작업</dt>
                        <dd>{labelOf(statusLabels, assignment.latestWorkStatus)}</dd>
                      </div>
                    </dl>
                    <p>{assignment.report.description ?? "상세 내용이 없습니다."}</p>
                    <form action={submitWorkUpdate} className="admin-form compact-form">
                      <div className="form-grid">
                        <label className="form-field">
                          <span>작업 상태</span>
                          <select
                            name="status"
                            defaultValue={nextWorkStatus(assignment.latestWorkStatus)}
                          >
                            {workStatusOptions.map((status) => (
                              <option key={status} value={status}>
                                {labelOf(statusLabels, status)}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="form-field">
                          <span>최종 금액</span>
                          <input
                            inputMode="numeric"
                            name="finalPrice"
                            placeholder="90000"
                            defaultValue={latestFinalPrice?.toString() ?? ""}
                          />
                        </label>
                      </div>
                      <label className="form-field">
                        <span>작업 메모</span>
                        <input name="note" placeholder="현장 도착, 고압 세척 완료 등" />
                      </label>
                      <div className="action-row">
                        <button className="primary-button" type="submit">
                          작업 상태 저장
                        </button>
                      </div>
                    </form>
                    <div className="work-update-list">
                      {assignment.workUpdates.map((update) => (
                        <div className="work-update-entry" key={update.id}>
                          <span>{formatDateTime(update.createdAt)}</span>
                          <strong>{labelOf(statusLabels, update.status)}</strong>
                          <p>
                            {update.note ?? "-"}
                            {update.finalPrice ? ` · ${formatCurrency(update.finalPrice)}` : ""}
                          </p>
                        </div>
                      ))}
                      {assignment.workUpdates.length === 0 ? (
                        <p className="empty-text">아직 작업 이력이 없습니다.</p>
                      ) : null}
                    </div>
                  </article>
                );
              })}
              {assignments.length === 0 ? (
                <p className="empty-text">현재 배정된 작업이 없습니다.</p>
              ) : null}
            </div>
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
