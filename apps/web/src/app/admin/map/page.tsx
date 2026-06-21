import { AdminShell } from "@/components/admin-shell";
import { ReportMap } from "@/components/report-map";
import { getReportMapMarkers } from "@/lib/map-api";

export const dynamic = "force-dynamic";

export default async function AdminMapPage() {
  const markers = await getReportMapMarkers();
  const kakaoJavascriptKey = process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY;
  const provider = kakaoJavascriptKey ? "kakao" : "fallback";
  const markerCount = markers.filter(
    (marker) =>
      typeof marker.latitude === "number" &&
      typeof marker.longitude === "number",
  ).length;

  return (
    <AdminShell>
      <header className="workspace-header">
        <p className="eyebrow">지도 현황</p>
        <h1>신고 위치</h1>
      </header>

      <section
        className="map-surface admin-map-surface"
        aria-label="관리자 신고 지도"
      >
        <div className="map-toolbar">
          <div>
            <p className="eyebrow">실제 지도</p>
            <h2>{markerCount}개 신고 마커</h2>
          </div>
          <span className="status-badge">
            {provider === "kakao" ? "Kakao 지도 활성화" : "Kakao 키 필요"}
          </span>
        </div>
        <ReportMap
          kakaoJavascriptKey={kakaoJavascriptKey}
          markers={markers}
          provider={provider}
        />
      </section>
    </AdminShell>
  );
}
