import Link from "next/link";
import { ArrowRight, FileSearch, MapPin, Phone } from "lucide-react";
import { createCustomerReportAction } from "@/app/actions";
import { ReportPhotoUploader } from "@/components/report-photo-uploader";

export default function NewReportPage() {
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
          <Link className="mode-tab active" href="/report/new">
            신규 신고
          </Link>
          <Link className="mode-tab" href="/report/lookup">
            내 신고 확인
          </Link>
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
            <input
              id="location"
              name="location"
              placeholder="주소, 동 이름, 상호명"
              required
            />
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

      <aside className="ops-panel" aria-label="신고 조회">
        <div className="timeline-card">
          <h2>내 신고 확인</h2>
          <Link className="secondary-button" href="/report/lookup">
            <FileSearch aria-hidden="true" size={16} />
            조회 화면으로 이동
          </Link>
        </div>
      </aside>
    </main>
  );
}
