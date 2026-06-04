import {
  ArrowRight,
  ClipboardList,
  FileSearch,
  KeyRound,
  MapPin,
  Phone,
  ShieldCheck
} from "lucide-react";
import { createCustomerReportAction } from "@/app/actions";
import { ReportPhotoUploader } from "@/components/report-photo-uploader";
import {
  getCustomerReportByVerification,
  getCustomerReportsByPhone,
  type CustomerReport
} from "@/lib/customer-api";
import {
  actorLabels,
  formatCurrency,
  formatDateTime,
  issueTypeLabels,
  labelOf,
  statusLabels,
  urgencyLabels
} from "@/lib/labels";

function ReportSummaryCard({ report }: { report: CustomerReport }) {
  return (
    <article className="customer-report-card">
      <div className="opportunity-head">
        <div>
          <span className="table-link">{report.reportNo}</span>
          <h3>{report.summary ?? "신고 요약 없음"}</h3>
        </div>
        <span className="status-badge">{labelOf(statusLabels, report.status)}</span>
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
          <dd>{report.placeName ?? report.roadAddressText ?? report.addressText ?? "-"}</dd>
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
              {labelOf(actorLabels, history.actorType)} · {history.reason ?? "-"}
            </small>
          </div>
        ))}
        {report.workUpdates.map((update) => (
          <div className="customer-progress-entry" key={update.id}>
            <span>{formatDateTime(update.createdAt)}</span>
            <strong>{labelOf(statusLabels, update.status)}</strong>
            <small>
              {update.contractorCompanyName} · {update.note ?? "-"}
              {update.finalPrice ? ` · ${formatCurrency(update.finalPrice)}` : ""}
            </small>
          </div>
        ))}
      </div>
    </article>
  );
}

export default async function Home({
  searchParams
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
    getCustomerReportByVerification(params.reportNo, params.verificationCode)
  ]);
  const reports = verifiedReport ? [verifiedReport] : phoneReports;
  const hasSearched = Boolean(
    params.lookupPhone?.trim() || (params.reportNo?.trim() && params.verificationCode?.trim())
  );

  return (
    <main className="shell">
      <section className="customer-panel" aria-labelledby="report-title">
        <div className="brand-row">
          <div className="brand-mark">바</div>
          <div>
            <p className="eyebrow">바로 뚫림</p>
            <h1 id="report-title">배수 문제 신고</h1>
          </div>
        </div>

        <div className="mode-tabs" aria-label="신고 모드">
          <button className={`mode-tab${hasSearched ? "" : " active"}`} type="button">
            신규 신고
          </button>
          <button className={`mode-tab${hasSearched ? " active" : ""}`} type="button">
            내 신고 확인
          </button>
        </div>

        <form action={createCustomerReportAction} className="report-form">
          <label htmlFor="phone">연락처</label>
          <div className="input-row">
            <Phone aria-hidden="true" size={18} />
            <input
              autoComplete="tel"
              id="phone"
              name="phone"
              placeholder="010-0000-0000"
              required
              type="tel"
            />
          </div>

          <label htmlFor="location">위치</label>
          <div className="input-row">
            <MapPin aria-hidden="true" size={18} />
            <input id="location" name="location" placeholder="주소, 동 이름, 상호명" required />
          </div>

          <label htmlFor="description">증상</label>
          <textarea
            id="description"
            name="description"
            placeholder="역류, 침수, 악취 등 현재 상황"
            required
            rows={5}
          />

          <ReportPhotoUploader />

          <button className="primary-button" type="submit">
            신고 접수 시작
            <ArrowRight aria-hidden="true" size={18} />
          </button>
        </form>
      </section>

      <aside className="ops-panel" aria-label="운영 현황">
        <div className="status-grid">
          <div className="metric">
            <ClipboardList aria-hidden="true" size={20} />
            <span>조회 결과</span>
            <strong>{reports.length}</strong>
          </div>
          <div className="metric">
            <ShieldCheck aria-hidden="true" size={20} />
            <span>해결 완료</span>
            <strong>{reports.filter((report) => report.status === "RESOLVED").length}</strong>
          </div>
        </div>

        <div className="timeline-card">
          <h2>내 신고 확인</h2>
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
        </div>

        <div className="customer-results">
          {reports.map((report) => (
            <ReportSummaryCard key={report.id} report={report} />
          ))}
          {hasSearched && reports.length === 0 ? (
            <p className="empty-text">조회된 신고가 없습니다.</p>
          ) : null}
          {!hasSearched ? (
            <p className="empty-text">연락처를 입력하면 접수했던 신고 목록을 확인할 수 있습니다.</p>
          ) : null}
        </div>
      </aside>
    </main>
  );
}
