"use server";

import { getSessionUser } from "@/lib/auth";
import { getReviewableReservation, submitReview, logEvent } from "@/lib/data";
import { messageForError } from "@/lib/constants";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type ReviewState = { error?: string };

export async function createReviewAction(_prev: ReviewState, fd: FormData): Promise<ReviewState> {
  const me = await getSessionUser();
  if (!me) return { error: "로그인이 필요해요." };

  const reservationId = String(fd.get("reservation_id") || "");
  const rating = Number(fd.get("rating") || 0);
  if (rating < 1 || rating > 5) return { error: "별점을 선택해 주세요." };

  const r = await getReviewableReservation(reservationId);
  if (!r || r.customerId !== me.id) return { error: "리뷰를 작성할 수 없어요." };
  if (r.status !== "completed") return { error: "시술 완료 후 리뷰를 작성할 수 있어요." };

  const photos = String(fd.get("photos") || "").split(/[\n,]/).map((s) => s.trim()).filter(Boolean);

  try {
    await submitReview(me.id, {
      reservationId,
      proId: r.proId,
      rating,
      text: String(fd.get("text") || "") || null,
      photos,
      serviceName: String(fd.get("service_name") || "") || r.service,
    });
  } catch (err) {
    const msg = String((err as { message?: string })?.message ?? "");
    if (msg.includes("duplicate") || msg.includes("unique")) return { error: "이미 리뷰를 작성했어요." };
    return { error: messageForError(err) };
  }

  await logEvent(me.id, "review_write", { reservation_id: reservationId });
  revalidatePath("/app/my/reservations");
  redirect("/app/my/reservations");
}
