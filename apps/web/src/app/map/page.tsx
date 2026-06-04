import { MapPinned } from "lucide-react";

export default function MapPage() {
  return (
    <main className="map-page">
      <section className="map-surface" aria-label="신고 지도">
        <div className="map-toolbar">
          <div>
            <p className="eyebrow">지도 현황</p>
            <h1>신고 위치</h1>
          </div>
          <span className="status-badge">Kakao Provider</span>
        </div>
        <div className="map-placeholder">
          <MapPinned aria-hidden="true" size={36} />
          <p>확정 좌표 기반 마커 영역</p>
        </div>
      </section>
    </main>
  );
}
