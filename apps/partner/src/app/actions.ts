"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PARTNER_COMPANY_COOKIE } from "@/lib/session";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

function textValue(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function numberValue(formData: FormData, key: string) {
  const value = textValue(formData, key);

  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function submitContractorBidAction(
  companyId: string,
  reportId: string,
  formData: FormData,
) {
  const response = await fetch(
    `${apiBaseUrl}/contractors/${encodeURIComponent(companyId)}/bids`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reportId,
        estimatedPrice: numberValue(formData, "estimatedPrice"),
        availableTime: textValue(formData, "availableTime"),
        canWork: true,
        workNote: textValue(formData, "workNote"),
        extraCostPolicy: textValue(formData, "extraCostPolicy"),
      }),
    },
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "입찰을 제출하지 못했습니다.");
  }

  revalidatePath("/");
  revalidatePath("/bids");
  redirect(`/bids?companyId=${encodeURIComponent(companyId)}`);
}

function appendText(target: FormData, key: string, value: string | null) {
  if (value) {
    target.append(key, value);
  }
}

function appendFile(
  target: FormData,
  key: string,
  value: FormDataEntryValue | null,
) {
  if (value instanceof File && value.size > 0) {
    target.append(key, value, value.name);
  }
}

export async function registerContractorAction(formData: FormData) {
  const apiFormData = new FormData();

  [
    "email",
    "name",
    "phone",
    "companyName",
    "representativeName",
    "businessNumber",
    "address",
    "latitude",
    "longitude",
    "serviceRegions",
    "serviceRadiusKm",
    "yearsOfExperience",
    "description",
  ].forEach((key) => appendText(apiFormData, key, textValue(formData, key)));
  formData.getAll("specialties").forEach((value) => {
    if (typeof value === "string" && value.trim().length > 0) {
      apiFormData.append("specialties", value);
    }
  });
  appendFile(apiFormData, "businessLicense", formData.get("businessLicense"));
  appendFile(apiFormData, "companyPhoto", formData.get("companyPhoto"));

  const response = await fetch(`${apiBaseUrl}/contractors/register`, {
    method: "POST",
    body: apiFormData,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "업체 등록 신청을 처리하지 못했습니다.");
  }

  const company = (await response.json()) as { id?: string };

  if (company?.id) {
    const store = await cookies();
    store.set(PARTNER_COMPANY_COOKIE, company.id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  revalidatePath("/");
  revalidatePath("/register");
  redirect("/");
}

export async function submitWorkUpdateAction(
  companyId: string,
  assignmentId: string,
  formData: FormData,
) {
  const response = await fetch(
    `${apiBaseUrl}/contractors/${encodeURIComponent(companyId)}/assignments/${encodeURIComponent(
      assignmentId,
    )}/work-updates`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: textValue(formData, "status"),
        note: textValue(formData, "note"),
        finalPrice: numberValue(formData, "finalPrice"),
      }),
    },
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "작업 상태를 저장하지 못했습니다.");
  }

  revalidatePath("/");
  revalidatePath("/jobs");
  redirect(`/jobs?companyId=${encodeURIComponent(companyId)}`);
}
