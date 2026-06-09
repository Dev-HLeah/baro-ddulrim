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

async function mutate(path: string, init: RequestInit) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "템플릿을 저장하지 못했습니다.");
  }
}

function templatePayload(formData: FormData) {
  return {
    name: textValue(formData, "name"),
    channel: textValue(formData, "channel"),
    content: textValue(formData, "content"),
    isActive: formData.get("isActive") === "on",
  };
}

export async function createMessageTemplateAction(formData: FormData) {
  await mutate("/message-templates", {
    method: "POST",
    body: JSON.stringify(templatePayload(formData)),
  });

  revalidatePath("/admin/templates");
  revalidatePath("/admin/templates/new");
  revalidatePath("/admin/reports");
  redirect("/admin/templates");
}

export async function updateMessageTemplateAction(
  templateId: string,
  formData: FormData,
) {
  await mutate(`/message-templates/${encodeURIComponent(templateId)}`, {
    method: "PATCH",
    body: JSON.stringify(templatePayload(formData)),
  });

  revalidatePath("/admin/templates");
  revalidatePath(`/admin/templates/${templateId}`);
  revalidatePath("/admin/reports");
  redirect(`/admin/templates/${templateId}`);
}
