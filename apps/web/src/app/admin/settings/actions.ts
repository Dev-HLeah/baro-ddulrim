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

export async function updateSettingAction(key: string, formData: FormData) {
  const response = await fetch(`${apiBaseUrl}/settings/${encodeURIComponent(key)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      value: textValue(formData, "value")
    })
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "설정을 저장하지 못했습니다.");
  }

  revalidatePath("/admin/settings");
  redirect("/admin/settings");
}
