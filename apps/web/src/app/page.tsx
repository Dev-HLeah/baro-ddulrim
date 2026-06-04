import { ArrowRight, ClipboardList, MapPin, Phone, ShieldCheck } from "lucide-react";

const recentReports = [
  {
    id: "BD-20260605-001",
    title: "상가 앞 배수구 역류",
    status: "관리자 검수중",
    date: "2026.06.05"
  },
  {
    id: "BD-20260604-004",
    title: "지하 주차장 침수",
    status: "업체 배정",
    date: "2026.06.04"
  }
];

export default function Home() {
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
          <button className="mode-tab active" type="button">
            신규 신고
          </button>
          <button className="mode-tab" type="button">
            내 신고 확인
          </button>
        </div>

        <form className="report-form">
          <label htmlFor="phone">연락처</label>
          <div className="input-row">
            <Phone aria-hidden="true" size={18} />
            <input id="phone" name="phone" placeholder="010-0000-0000" type="tel" />
          </div>

          <label htmlFor="location">위치</label>
          <div className="input-row">
            <MapPin aria-hidden="true" size={18} />
            <input id="location" name="location" placeholder="주소, 동 이름, 상호명" />
          </div>

          <label htmlFor="description">증상</label>
          <textarea
            id="description"
            name="description"
            placeholder="역류, 침수, 악취 등 현재 상황"
            rows={5}
          />

          <button className="primary-button" type="button">
            신고 접수 시작
            <ArrowRight aria-hidden="true" size={18} />
          </button>
        </form>
      </section>

      <aside className="ops-panel" aria-label="운영 현황">
        <div className="status-grid">
          <div className="metric">
            <ClipboardList aria-hidden="true" size={20} />
            <span>오늘 접수</span>
            <strong>12</strong>
          </div>
          <div className="metric">
            <ShieldCheck aria-hidden="true" size={20} />
            <span>배정 완료</span>
            <strong>8</strong>
          </div>
        </div>

        <div className="timeline-card">
          <h2>최근 신고</h2>
          <div className="report-list">
            {recentReports.map((report) => (
              <article className="report-item" key={report.id}>
                <div>
                  <p>{report.title}</p>
                  <span>{report.id}</span>
                </div>
                <div className="report-meta">
                  <span className="status-badge">{report.status}</span>
                  <time>{report.date}</time>
                </div>
              </article>
            ))}
          </div>
        </div>
      </aside>
    </main>
  );
}
