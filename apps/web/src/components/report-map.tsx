"use client";

import { MapPin } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { MapProviderName, ReportMapMarker } from "@/lib/map-api";
import {
  formatDateTime,
  issueTypeLabels,
  labelOf,
  statusLabels,
  urgencyLabels
} from "@/lib/labels";

type ReportMapProps = {
  markers: ReportMapMarker[];
  provider: MapProviderName;
  kakaoJavascriptKey?: string;
};

type KakaoWindow = Window & {
  kakao?: {
    maps: {
      LatLng: new (latitude: number, longitude: number) => unknown;
      Map: new (container: HTMLElement, options: Record<string, unknown>) => unknown;
      Marker: new (options: Record<string, unknown>) => { setMap: (map: unknown) => void };
      InfoWindow: new (options: Record<string, unknown>) => { open: (map: unknown, marker: unknown) => void };
      event: {
        addListener: (target: unknown, eventName: string, handler: () => void) => void;
      };
      load: (callback: () => void) => void;
    };
  };
};

function markerAddress(marker: ReportMapMarker) {
  return marker.placeName ?? marker.roadAddressText ?? marker.addressText ?? "-";
}

function markerTone(marker: ReportMapMarker) {
  if (marker.status === "RESOLVED") {
    return "resolved";
  }

  if (marker.urgency === "EMERGENCY") {
    return "emergency";
  }

  if (marker.urgency === "URGENT") {
    return "urgent";
  }

  return "normal";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function ReportMap({ markers, provider, kakaoJavascriptKey }: ReportMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const validMarkers = useMemo(
    () =>
      markers.filter(
        (marker) => typeof marker.latitude === "number" && typeof marker.longitude === "number"
      ),
    [markers]
  );
  const [selectedId, setSelectedId] = useState(validMarkers[0]?.id ?? null);
  const selectedMarker = validMarkers.find((marker) => marker.id === selectedId) ?? validMarkers[0];
  const hasKakaoKey = provider === "kakao" && Boolean(kakaoJavascriptKey);
  const bounds = useMemo(() => {
    const latitudes = validMarkers.map((marker) => marker.latitude as number);
    const longitudes = validMarkers.map((marker) => marker.longitude as number);
    const minLatitude = Math.min(...latitudes);
    const maxLatitude = Math.max(...latitudes);
    const minLongitude = Math.min(...longitudes);
    const maxLongitude = Math.max(...longitudes);

    return {
      minLatitude,
      maxLatitude: maxLatitude === minLatitude ? maxLatitude + 0.01 : maxLatitude,
      minLongitude,
      maxLongitude: maxLongitude === minLongitude ? maxLongitude + 0.01 : maxLongitude
    };
  }, [validMarkers]);

  useEffect(() => {
    if (!hasKakaoKey || !mapRef.current || validMarkers.length === 0) {
      return;
    }

    const kakaoWindow = window as KakaoWindow;
    const renderMap = () => {
      if (!mapRef.current || !kakaoWindow.kakao) {
        return;
      }

      kakaoWindow.kakao.maps.load(() => {
        const centerMarker = selectedMarker ?? validMarkers[0];
        const center = new kakaoWindow.kakao!.maps.LatLng(
          centerMarker.latitude as number,
          centerMarker.longitude as number
        );
        const map = new kakaoWindow.kakao!.maps.Map(mapRef.current!, {
          center,
          level: 8
        });

        validMarkers.forEach((marker) => {
          const position = new kakaoWindow.kakao!.maps.LatLng(
            marker.latitude as number,
            marker.longitude as number
          );
          const kakaoMarker = new kakaoWindow.kakao!.maps.Marker({ position });
          const infoWindow = new kakaoWindow.kakao!.maps.InfoWindow({
            content: `<div style="padding:8px 10px;font-size:13px;">${escapeHtml(
              marker.summary ?? marker.reportNo
            )}</div>`
          });

          kakaoMarker.setMap(map);
          kakaoWindow.kakao!.maps.event.addListener(kakaoMarker, "click", () => {
            setSelectedId(marker.id);
            infoWindow.open(map, kakaoMarker);
          });
        });
      });
    };

    if (kakaoWindow.kakao) {
      renderMap();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoJavascriptKey}&autoload=false`;
    script.async = true;
    script.onload = renderMap;
    document.head.appendChild(script);
  }, [hasKakaoKey, kakaoJavascriptKey, selectedMarker, validMarkers]);

  function fallbackPosition(marker: ReportMapMarker) {
    const latitude = marker.latitude as number;
    const longitude = marker.longitude as number;
    const x = ((longitude - bounds.minLongitude) / (bounds.maxLongitude - bounds.minLongitude)) * 82 + 9;
    const y = (1 - (latitude - bounds.minLatitude) / (bounds.maxLatitude - bounds.minLatitude)) * 74 + 13;

    return {
      left: `${x}%`,
      top: `${y}%`
    };
  }

  return (
    <div className="report-map-layout">
      <div className="report-map-canvas" aria-label="신고 위치 마커">
        {hasKakaoKey ? <div className="kakao-map-container" ref={mapRef} /> : null}
        {!hasKakaoKey ? (
          <div className="fallback-map-grid">
            {validMarkers.map((marker) => (
              <button
                aria-label={`${marker.reportNo} ${marker.summary ?? ""}`}
                className={`map-marker-dot ${markerTone(marker)}${
                  selectedMarker?.id === marker.id ? " active" : ""
                }`}
                key={marker.id}
                onClick={() => setSelectedId(marker.id)}
                style={fallbackPosition(marker)}
                type="button"
              >
                <MapPin aria-hidden="true" size={18} />
              </button>
            ))}
            {validMarkers.length === 0 ? (
              <div className="map-empty-state">
                <MapPin aria-hidden="true" size={28} />
                <p>확정 좌표가 있는 신고가 없습니다.</p>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <aside className="report-map-panel" aria-label="선택된 신고">
        {selectedMarker ? (
          <>
            <span className={`urgency-badge ${selectedMarker.urgency.toLowerCase()}`}>
              {labelOf(urgencyLabels, selectedMarker.urgency)}
            </span>
            <h2>{selectedMarker.summary ?? selectedMarker.reportNo}</h2>
            <dl className="info-list compact-list">
              <div>
                <dt>상태</dt>
                <dd>{labelOf(statusLabels, selectedMarker.status)}</dd>
              </div>
              <div>
                <dt>유형</dt>
                <dd>{labelOf(issueTypeLabels, selectedMarker.issueType)}</dd>
              </div>
              <div>
                <dt>위치</dt>
                <dd>{markerAddress(selectedMarker)}</dd>
              </div>
              <div>
                <dt>업체</dt>
                <dd>{selectedMarker.assignedCompanyName ?? "-"}</dd>
              </div>
              <div>
                <dt>접수</dt>
                <dd>{formatDateTime(selectedMarker.createdAt)}</dd>
              </div>
              <div>
                <dt>해결</dt>
                <dd>{formatDateTime(selectedMarker.resolvedAt)}</dd>
              </div>
            </dl>
          </>
        ) : (
          <p className="empty-text">마커를 선택하면 신고와 처리 상태를 볼 수 있습니다.</p>
        )}
      </aside>
    </div>
  );
}
