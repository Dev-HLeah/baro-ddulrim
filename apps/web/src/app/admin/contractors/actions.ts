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

export async function updateContractorStatusAction(companyId: string, formData: FormData) {
  const response = await fetch(
    `${apiBaseUrl}/contractors/admin/companies/${encodeURIComponent(companyId)}/status`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        status: textValue(formData, "status"),
        statusReason: textValue(formData, "statusReason")
      })
    }
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "업체 상태를 변경하지 못했습니다.");
  }

  revalidatePath("/admin/contractors");
  revalidatePath("/contractor");
  redirect("/admin/contractors");
}
