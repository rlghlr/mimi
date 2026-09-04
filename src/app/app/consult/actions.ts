"use server";

import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
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

  const supabase = createClient();
  const { error } = await supabase.from("consultations").insert({
    customer_id: me.id,
    category_id: String(fd.get("category_id") || "") || null,
    content,
    current_photo: String(fd.get("current_photo") || "") || null,
    desired_photo: String(fd.get("desired_photo") || "") || null,
    region: String(fd.get("region") || "") || null,
    budget: fd.get("budget") ? Number(fd.get("budget")) : null,
    available_dates: String(fd.get("available_dates") || "")
      .split(",").map((s) => s.trim()).filter(Boolean),
    status: "open",
  });
  if (error) return { error: messageForError(error) };

  revalidatePath("/app/consult");
  redirect("/app/consult?created=1");
}
