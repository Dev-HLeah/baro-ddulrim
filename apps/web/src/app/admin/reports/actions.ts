"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

async function mutate(path: string, init: RequestInit) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {})
    }
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "관리자 작업을 처리하지 못했습니다.");
  }
}

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

export async function updateReportAction(reportNo: string, formData: FormData) {
  await mutate(`/reports/${encodeURIComponent(reportNo)}`, {
    method: "PATCH",
    body: JSON.stringify({
      summary: textValue(formData, "summary"),
      issueType: textValue(formData, "issueType"),
      urgency: textValue(formData, "urgency"),
      description: textValue(formData, "description"),
      addressText: textValue(formData, "addressText"),
      roadAddressText: textValue(formData, "roadAddressText"),
      placeName: textValue(formData, "placeName"),
      latitude: numberValue(formData, "latitude"),
      longitude: numberValue(formData, "longitude"),
      reason: textValue(formData, "reason")
    })
  });

  revalidatePath("/admin");
  revalidatePath("/admin/reports");
  revalidatePath(`/admin/reports/${reportNo}`);
  redirect(`/admin/reports/${reportNo}`);
}

export async function approveReportAction(reportNo: string, formData: FormData) {
  await mutate(`/reports/${encodeURIComponent(reportNo)}/approve`, {
    method: "POST",
    body: JSON.stringify({
      reason: textValue(formData, "reason")
    })
  });

  revalidatePath("/admin");
  revalidatePath("/admin/reports");
  revalidatePath(`/admin/reports/${reportNo}`);
  redirect(`/admin/reports/${reportNo}`);
}

export async function assignBidAction(reportNo: string, formData: FormData) {
  await mutate(`/reports/${encodeURIComponent(reportNo)}/assign`, {
    method: "POST",
    body: JSON.stringify({
      bidId: textValue(formData, "bidId"),
      selectionReason: textValue(formData, "selectionReason"),
      templateId: textValue(formData, "templateId")
    })
  });

  revalidatePath("/admin");
  revalidatePath("/admin/reports");
  revalidatePath(`/admin/reports/${reportNo}`);
  redirect(`/admin/reports/${reportNo}`);
}
