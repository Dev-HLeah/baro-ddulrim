export type MapProviderName = "kakao" | "fallback";

export type ReportMapMarker = {
  id: string;
  reportNo: string;
  status: string;
  issueType: string | null;
  urgency: string;
  summary: string | null;
  addressText: string | null;
  roadAddressText: string | null;
  placeName: string | null;
  latitude: number | null;
  longitude: number | null;
  assignedCompanyName: string | null;
  latestWorkStatus: string | null;
  latestWorkNote: string | null;
  createdAt: string | null;
  assignedAt: string | null;
  resolvedAt: string | null;
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

async function fetchJson<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      cache: "no-store"
    });

    if (!response.ok) {
      return fallback;
    }

    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}

export function getReportMapMarkers() {
  return fetchJson<ReportMapMarker[]>("/maps/reports", []);
}
