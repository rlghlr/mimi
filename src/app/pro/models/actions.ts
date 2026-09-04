"use server";

import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { messageForError } from "@/lib/constants";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type OfferState = { error?: string };

export async function sendOfferAction(_prev: OfferState, fd: FormData): Promise<OfferState> {
  const me = await getSessionUser();
  if (!me) return { error: "로그인이 필요해요." };
  const supabase = createClient();

  const { data: profile } = await supabase
    .from("professional_profiles").select("approved").eq("user_id", me.id).single();
  if (!profile?.approved) return { error: "운영자 승인 후 제안을 보낼 수 있어요." };

  const consultationId = String(fd.get("consultation_id") || "");
  const { data: consult } = await supabase
    .from("consultations").select("customer_id, status").eq("id", consultationId).single();
  if (!consult) return { error: "삭제된 상담이에요." };

  const { error } = await supabase.from("consultation_offers").insert({
    consultation_id: consultationId,
    pro_id: me.id,
    recommend: String(fd.get("recommend") || "") || null,
    method: String(fd.get("method") || "") || null,
    price: fd.get("price") ? Number(fd.get("price")) : null,
    duration_min: fd.get("duration_min") ? Number(fd.get("duration_min")) : null,
    available_dates: String(fd.get("available_dates") || "").split(",").map((s) => s.trim()).filter(Boolean),
    message: String(fd.get("message") || "") || null,
    status: "sent",
  });
  if (error) {
    if (error.message.includes("duplicate")) return { error: "이미 이 상담에 제안을 보냈어요." };
    return { error: messageForError(error) };
  }

  await supabase.from("consultations").update({ status: "offered" }).eq("id", consultationId).eq("status", "open");
  await supabase.rpc("notify" as never, {
    p_user: consult.customer_id, p_type: "offer", p_title: "새 제안이 도착했어요",
    p_body: "상담에 전문가 제안이 도착했어요. 확인해 보세요.",
    p_ref_type: "consultation", p_ref_id: consultationId,
  } as never);

  revalidatePath("/pro/models");
  redirect("/pro/models?sent=1");
}
