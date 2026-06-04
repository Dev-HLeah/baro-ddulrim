"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

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

export async function submitContractorBidAction(companyId: string, reportId: string, formData: FormData) {
  const response = await fetch(`${apiBaseUrl}/contractors/${encodeURIComponent(companyId)}/bids`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      reportId,
      estimatedPrice: numberValue(formData, "estimatedPrice"),
      availableTime: textValue(formData, "availableTime"),
      canWork: true,
      workNote: textValue(formData, "workNote"),
      extraCostPolicy: textValue(formData, "extraCostPolicy")
    })
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "입찰을 제출하지 못했습니다.");
  }

  revalidatePath("/contractor");
  redirect(`/contractor?companyId=${encodeURIComponent(companyId)}`);
}
