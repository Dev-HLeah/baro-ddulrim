export type ContractorCompany = {
  id: string;
  companyName: string;
  representativeName: string;
  phone: string;
  email: string;
  status: string;
  serviceRegions: string[];
  serviceRadiusKm: number | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  bidCount: number;
  assignmentCount: number;
  workUpdateCount: number;
};

export type ContractorBid = {
  id: string;
  reportId: string;
  contractorCompanyId: string;
  estimatedPrice: number | null;
  availableTime: string | null;
  canWork: boolean;
  workNote: string | null;
  extraCostPolicy: string | null;
  status: string;
  submittedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type ContractorOpportunity = {
  id: string;
  reportNo: string;
  status: string;
  issueType: string | null;
  urgency: string;
  summary: string | null;
  description: string | null;
  addressText: string | null;
  roadAddressText: string | null;
  placeName: string | null;
  latitude: number | null;
  longitude: number | null;
  bidCount: number;
  attachmentCount: number;
  messageCount: number;
  createdAt: string | null;
  adminApprovedAt: string | null;
  myBid: ContractorBid | null;
};

export type ContractorBidWithReport = ContractorBid & {
  report: {
    id: string;
    reportNo: string;
    status: string;
    issueType: string | null;
    urgency: string;
    summary: string | null;
    placeName: string | null;
    addressText: string | null;
    assignedCompanyName: string | null;
    createdAt: string | null;
    assignedAt: string | null;
    resolvedAt: string | null;
  };
};

export type ContractorAssignment = {
  id: string;
  reportId: string;
  bidId: string;
  contractorCompanyId: string;
  selectionReason: string | null;
  customerMessageRendered: string | null;
  assignedAt: string | null;
  createdAt: string | null;
  bid: {
    estimatedPrice: number | null;
    availableTime: string | null;
    workNote: string | null;
    extraCostPolicy: string | null;
  };
  report: {
    id: string;
    reportNo: string;
    status: string;
    issueType: string | null;
    urgency: string;
    summary: string | null;
    description: string | null;
    addressText: string | null;
    roadAddressText: string | null;
    placeName: string | null;
    latitude: number | null;
    longitude: number | null;
    assignedAt: string | null;
    resolvedAt: string | null;
    createdAt: string | null;
  };
  latestWorkStatus: string | null;
  workUpdates: Array<{
    id: string;
    status: string;
    note: string | null;
    finalPrice: number | null;
    createdAt: string | null;
  }>;
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

export function getContractorCompanies() {
  return fetchJson<ContractorCompany[]>("/contractors/companies", []);
}

export function getContractorOpportunities(companyId: string) {
  return fetchJson<ContractorOpportunity[]>(
    `/contractors/${encodeURIComponent(companyId)}/opportunities`,
    []
  );
}

export function getContractorBids(companyId: string) {
  return fetchJson<ContractorBidWithReport[]>(`/contractors/${encodeURIComponent(companyId)}/bids`, []);
}

export function getContractorAssignments(companyId: string) {
  return fetchJson<ContractorAssignment[]>(
    `/contractors/${encodeURIComponent(companyId)}/assignments`,
    []
  );
}
