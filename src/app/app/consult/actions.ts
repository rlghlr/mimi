"use server";

import { getSessionUser } from "@/lib/auth";
import { createConsultation } from "@/lib/data";
import { messageForError } from "@/lib/constants";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type ConsultState = { error?: string };

export async function createConsultationAction(
  _prev: ConsultState,
  fd: FormData
): Promise<ConsultState> {
  const me = await getSessionUser();
  if (!me) return { error: "로그인이 필요해요." };
  const content = String(fd.get("content") || "").trim();
  if (!content) return { error: "고민 내용을 입력해 주세요." };

  try {
    await createConsultation(me.id, {
      categoryId: String(fd.get("category_id") || "") || null,
      content,
      currentPhoto: String(fd.get("current_photo") || "") || null,
      desiredPhoto: String(fd.get("desired_photo") || "") || null,
      region: String(fd.get("region") || "") || null,
      budget: fd.get("budget") ? Number(fd.get("budget")) : null,
      availableDates: String(fd.get("available_dates") || "")
        .split(",").map((s) => s.trim()).filter(Boolean),
      status: "open",
    });
  } catch (err) {
    return { error: messageForError(err) };
  }

  revalidatePath("/app/consult");
  redirect("/app/consult?created=1");
}
