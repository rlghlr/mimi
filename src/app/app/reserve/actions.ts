"use server";

import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { messageForError } from "@/lib/constants";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export type ReserveState = { error?: string };

export async function createReservationAction(
  _prev: ReserveState,
  fd: FormData
): Promise<ReserveState> {
  const me = await getSessionUser();
  if (!me) return { error: "로그인이 필요해요." };
  const supabase = createClient();

  const proId = String(fd.get("pro_id") || "");
  if (!proId) return { error: "전문가 정보가 없어요." };

  const amount = Number(fd.get("amount") || 0);
  const discount = Number(fd.get("discount") || 0);

  // fetch pro's shop
  const { data: prof } = await supabase.from("professional_profiles").select("shop_id").eq("user_id", proId).single();

  const { data: reservation, error } = await supabase
    .from("reservations")
    .insert({
      customer_id: me.id,
      pro_id: proId,
      shop_id: prof?.shop_id ?? null,
      service: String(fd.get("service") || "") || null,
      session_date: String(fd.get("session_date") || "") || null,
      session_time: String(fd.get("session_time") || "") || null,
      duration_min: fd.get("duration_min") ? Number(fd.get("duration_min")) : null,
      amount,
      discount,
      final_amount: Math.max(0, amount - discount),
      status: "requested",
    })
    .select("id")
    .single();
  if (error || !reservation) return { error: messageForError(error) };

  // electronic consent (item-by-item)
  const ip = headers().get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  await supabase.from("consents").insert({
    reservation_id: reservation.id,
    user_id: me.id,
    face: fd.get("c_face") === "on",
    process: fd.get("c_process") === "on",
    before_after: fd.get("c_ba") === "on",
    sns: fd.get("c_sns") === "on",
    ad: fd.get("c_ad") === "on",
    portfolio: fd.get("c_portfolio") === "on",
    ip,
  });

  await supabase.rpc("notify" as never, {
    p_user: proId, p_type: "reservation", p_title: "새 예약 요청",
    p_body: "새로운 예약 요청이 도착했어요. 확인해 주세요.",
    p_ref_type: "reservation", p_ref_id: reservation.id,
  } as never);
  await supabase.from("events").insert({ user_id: me.id, name: "reservation_create", props: { pro_id: proId } });

  revalidatePath("/app/my/reservations");
  redirect("/app/my/reservations?requested=1");
}

const NEXT_LABEL: Record<string, string> = {
  confirmed: "예약을 확정했어요", upcoming: "방문 예정으로 변경됐어요",
  completed: "시술 완료 처리됐어요", cancelled: "예약이 취소됐어요", no_show: "노쇼로 기록됐어요",
};

export async function updateReservationStatusAction(formData: FormData) {
  const id = String(formData.get("reservation_id"));
  const status = String(formData.get("status"));
  const me = (await getSessionUser())!;
  const supabase = createClient();

  const { data: r } = await supabase.from("reservations").select("customer_id, pro_id").eq("id", id).single();
  if (!r) return;

  await supabase.from("reservations").update({ status: status as never }).eq("id", id);

  if (status === "completed") {
    await supabase.from("events").insert({ user_id: me.id, name: "reservation_complete", props: { reservation_id: id } });
  }
  if (status === "no_show") {
    await supabase.rpc("increment_no_show" as never, { p_user: r.customer_id } as never);
  }

  const notifyTarget = me.id === r.pro_id ? r.customer_id : r.pro_id;
  await supabase.rpc("notify" as never, {
    p_user: notifyTarget, p_type: "reservation", p_title: "예약 상태 변경",
    p_body: NEXT_LABEL[status] ?? "예약 상태가 변경됐어요.", p_ref_type: "reservation", p_ref_id: id,
  } as never);

  revalidatePath("/app/my/reservations");
  revalidatePath("/pro/my/reservations");
}
