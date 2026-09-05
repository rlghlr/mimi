"use server";

import { getSessionUser } from "@/lib/auth";
import { getProApproved, getConsultationOwner, createOffer, markConsultationOffered, notify } from "@/lib/data";
import { messageForError } from "@/lib/constants";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type OfferState = { error?: string };

export async function sendOfferAction(_prev: OfferState, fd: FormData): Promise<OfferState> {
  const me = await getSessionUser();
  if (!me) return { error: "로그인이 필요해요." };

  if (!(await getProApproved(me.id))) return { error: "운영자 승인 후 제안을 보낼 수 있어요." };

  const consultationId = String(fd.get("consultation_id") || "");
  const consult = await getConsultationOwner(consultationId);
  if (!consult) return { error: "삭제된 상담이에요." };

  try {
    await createOffer(me.id, consultationId, {
      recommend: String(fd.get("recommend") || "") || null,
      method: String(fd.get("method") || "") || null,
      price: fd.get("price") ? Number(fd.get("price")) : null,
      durationMin: fd.get("duration_min") ? Number(fd.get("duration_min")) : null,
      availableDates: String(fd.get("available_dates") || "").split(",").map((s) => s.trim()).filter(Boolean),
      message: String(fd.get("message") || "") || null,
    });
  } catch (err) {
    const msg = String((err as { message?: string })?.message ?? "");
    if (msg.includes("duplicate") || msg.includes("unique")) return { error: "이미 이 상담에 제안을 보냈어요." };
    return { error: messageForError(err) };
  }

  await markConsultationOffered(consultationId);
  await notify(consult.customerId, "offer", "새 제안이 도착했어요",
    "상담에 전문가 제안이 도착했어요. 확인해 보세요.", "consultation", consultationId);

  revalidatePath("/pro/models");
  redirect("/pro/models?sent=1");
}
