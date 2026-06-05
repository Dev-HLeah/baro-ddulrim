import { AdminShell } from "@/components/admin-shell";
import { getAdminContractorCompanies } from "@/lib/admin-api";
import { contractorStatusLabels, formatDateTime, labelOf } from "@/lib/labels";
import { updateContractorStatusAction } from "./actions";

export const dynamic = "force-dynamic";

const contractorStatuses = ["REVIEWING", "APPROVED", "ACTIVE", "INACTIVE", "RESTRICTED", "REJECTED"];

export default async function AdminContractorsPage() {
  const companies = await getAdminContractorCompanies();

  return (
    <AdminShell>
      <header className="workspace-header">
        <p className="eyebrow">업체</p>
        <h1>업체 관리</h1>
      </header>

      <section className="dashboard-grid compact">
        <article className="metric">
          <span>전체</span>
          <strong>{companies.length}</strong>
        </article>
        <article className="metric">
          <span>검토중</span>
          <strong>{companies.filter((company) => company.status === "REVIEWING").length}</strong>
        </article>
        <article className="metric">
          <span>활성 가능</span>
          <strong>
            {companies.filter((company) => ["APPROVED", "ACTIVE"].includes(company.status)).length}
          </strong>
        </article>
        <article className="metric">
          <span>제한/반려</span>
          <strong>
            {
              companies.filter((company) => ["RESTRICTED", "REJECTED"].includes(company.status))
                .length
            }
          </strong>
        </article>
      </section>

      <section className="contractor-admin-grid">
        {companies.map((company) => {
          const updateStatus = updateContractorStatusAction.bind(null, company.id);

          return (
            <article className="contractor-admin-card" key={company.id}>
              <div className="section-header">
                <div>
                  <p className="eyebrow">{company.businessNumber}</p>
                  <h2>{company.companyName}</h2>
                </div>
                <span className="status-badge">{labelOf(contractorStatusLabels, company.status)}</span>
              </div>

              <dl className="info-list compact-list">
                <div>
                  <dt>대표</dt>
                  <dd>{company.representativeName}</dd>
                </div>
                <div>
                  <dt>담당</dt>
                  <dd>
                    {company.managerName} · {company.phone}
                  </dd>
                </div>
                <div>
                  <dt>이메일</dt>
                  <dd>{company.email}</dd>
                </div>
                <div>
                  <dt>지역</dt>
                  <dd>{company.serviceRegions.join(", ") || "-"}</dd>
                </div>
                <div>
                  <dt>주소</dt>
                  <dd>{company.address ?? "-"}</dd>
                </div>
                <div>
                  <dt>승인</dt>
                  <dd>{formatDateTime(company.approvedAt)}</dd>
                </div>
              </dl>

              <div className="tag-row">
                <span>입찰 {company.bidCount}</span>
                <span>배정 {company.assignmentCount}</span>
                <span>작업 {company.workUpdateCount}</span>
                {company.businessLicenseFileUrl ? (
                  <a className="text-link" href={company.businessLicenseFileUrl} target="_blank">
                    사업자등록증
                  </a>
                ) : null}
                {company.companyPhotoUrl ? (
                  <a className="text-link" href={company.companyPhotoUrl} target="_blank">
                    업체 사진
                  </a>
                ) : null}
              </div>

              {company.description ? <p>{company.description}</p> : null}

              <form action={updateStatus} className="admin-form compact-form">
                <label className="form-field">
                  <span>상태</span>
                  <select name="status" defaultValue={company.status}>
                    {contractorStatuses.map((status) => (
                      <option key={status} value={status}>
                        {labelOf(contractorStatusLabels, status)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="form-field">
                  <span>상태 사유</span>
                  <input
                    name="statusReason"
                    defaultValue={company.statusReason ?? ""}
                    placeholder="서류 확인 완료"
                  />
                </label>
                <div className="action-row">
                  <button className="secondary-button" type="submit">
                    상태 저장
                  </button>
                </div>
              </form>
            </article>
          );
        })}
        {companies.length === 0 ? <p className="empty-text">등록된 업체가 없습니다.</p> : null}
      </section>
    </AdminShell>
  );
}
