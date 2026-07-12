import Link from "next/link";
import { ArrowRight, FileSearch, Phone } from "lucide-react";
import { createCustomerReportAction } from "@/app/actions";
import { LocationSearchInput } from "@/components/location-search-input";
import { PendingOverlay } from "@/components/pending-overlay";
import { ReportPhotoUploader } from "@/components/report-photo-uploader";
import { SubmitButton } from "@/components/submit-button";
import Image from "next/image";

export default function NewReportPage() {
  return (
    <main className="shell">
      <section className="customer-panel" aria-labelledby="report-title">
        <div className="brand-row">
          <Image src="/character.png" alt="바로뚫림 캐릭터" width={56} height={56} style={{ objectFit: 'contain' }} priority />
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
          <PendingOverlay message="신고를 정리하고 있어요. 잠시만 기다려 주세요." />
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

          <LocationSearchInput />

          <label htmlFor="description">증상</label>
          <textarea
            id="description"
            name="description"
            placeholder="역류, 침수, 악취 등 현재 상황"
            required
            rows={5}
          />

          <fieldset className="urgency-choice">
            <legend>얼마나 급한가요?</legend>
            <div className="urgency-options">
              <label className="urgency-option">
                <input defaultChecked name="urgency" type="radio" value="NORMAL" />
                <span>
                  <strong>보통</strong>
                  <small>며칠 안에 처리되면 돼요</small>
                </span>
              </label>
              <label className="urgency-option">
                <input name="urgency" type="radio" value="URGENT" />
                <span>
                  <strong>급함</strong>
                  <small>오늘 안에 봐주세요</small>
                </span>
              </label>
              <label className="urgency-option">
                <input name="urgency" type="radio" value="EMERGENCY" />
                <span>
                  <strong>긴급</strong>
                  <small>지금 물이 넘치고 있어요</small>
                </span>
              </label>
            </div>
          </fieldset>

          <ReportPhotoUploader />

          <SubmitButton className="primary-button" type="submit">
            신고 접수 시작
            <ArrowRight aria-hidden="true" size={18} />
          </SubmitButton>
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
