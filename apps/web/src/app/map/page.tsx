import { ReportMap } from "@/components/report-map";
import { getReportMapMarkers } from "@/lib/map-api";

export const dynamic = "force-dynamic";

export default async function MapPage() {
  const markers = await getReportMapMarkers();
  const kakaoJavascriptKey = process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY;
  const provider = kakaoJavascriptKey ? "kakao" : "fallback";

  return (
    <main className="map-page">
      <section className="map-surface" aria-label="신고 지도">
        <div className="map-toolbar">
          <div>
            <p className="eyebrow">지도 현황</p>
            <h1>우리 동네 배수 신고 현황</h1>
          </div>
        </div>
        <ReportMap
          kakaoJavascriptKey={kakaoJavascriptKey}
          markers={markers}
          provider={provider}
        />
      </section>
    </main>
  );
}
