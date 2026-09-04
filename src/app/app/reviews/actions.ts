"use server";

import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { messageForError } from "@/lib/constants";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type ReviewState = { error?: string };

export async function createReviewAction(_prev: ReviewState, fd: FormData): Promise<ReviewState> {
  const me = await getSessionUser();
  if (!me) return { error: "로그인이 필요해요." };
  const supabase = createClient();

  const reservationId = String(fd.get("reservation_id") || "");
  const rating = Number(fd.get("rating") || 0);
  if (rating < 1 || rating > 5) return { error: "별점을 선택해 주세요." };

  // verify the reservation is the reviewer's and completed
  const { data: r } = await supabase
    .from("reservations")
    .select("id, customer_id, pro_id, status, service")
    .eq("id", reservationId)
    .single();
  if (!r || r.customer_id !== me.id) return { error: "리뷰를 작성할 수 없어요." };
  if (r.status !== "completed") return { error: "시술 완료 후 리뷰를 작성할 수 있어요." };

  const photos = String(fd.get("photos") || "").split(/[\n,]/).map((s) => s.trim()).filter(Boolean);

  const { error } = await supabase.from("reviews").insert({
    reservation_id: reservationId,
    author_id: me.id,
    pro_id: r.pro_id,
    rating,
    text: String(fd.get("text") || "") || null,
    photos,
    service_name: String(fd.get("service_name") || "") || r.service,
  });
  if (error) {
    if (error.message.includes("duplicate")) return { error: "이미 리뷰를 작성했어요." };
    return { error: messageForError(error) };
  }

  await supabase.from("events").insert({ user_id: me.id, name: "review_write", props: { reservation_id: reservationId } });
  revalidatePath("/app/my/reservations");
  redirect("/app/my/reservations");
}
