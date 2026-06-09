"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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

  revalidatePath("/contractor");
  revalidatePath("/contractor/bids");
  redirect(`/contractor/bids?companyId=${encodeURIComponent(companyId)}`);
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
    "serviceRegions",
    "serviceRadiusKm",
    "description",
  ].forEach((key) => appendText(apiFormData, key, textValue(formData, key)));
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

  revalidatePath("/contractor");
  revalidatePath("/contractor/register");
  revalidatePath("/admin/contractors");
  redirect("/contractor/register?registered=1");
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

  revalidatePath("/contractor");
  revalidatePath("/contractor/jobs");
  revalidatePath("/admin");
  revalidatePath("/admin/reports");
  redirect(`/contractor/jobs?companyId=${encodeURIComponent(companyId)}`);
}
