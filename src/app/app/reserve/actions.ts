"use server";

import { getSessionUser } from "@/lib/auth";
import {
  getProShopId, createReservation, createConsent, notify, logEvent,
  getReservationParties, setReservationStatus, incrementNoShow,
} from "@/lib/data";
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

  const proId = String(fd.get("pro_id") || "");
  if (!proId) return { error: "전문가 정보가 없어요." };

  const amount = Number(fd.get("amount") || 0);
  const discount = Number(fd.get("discount") || 0);

  let reservationId: string;
  try {
    const shopId = await getProShopId(proId);
    reservationId = await createReservation(me.id, {
      proId,
      shopId,
      service: String(fd.get("service") || "") || null,
      sessionDate: String(fd.get("session_date") || "") || null,
      sessionTime: String(fd.get("session_time") || "") || null,
      durationMin: fd.get("duration_min") ? Number(fd.get("duration_min")) : null,
      amount,
      discount,
      finalAmount: Math.max(0, amount - discount),
      status: "requested",
    });
  } catch (err) {
    return { error: messageForError(err) };
  }

  // electronic consent (item-by-item)
  const ip = headers().get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  await createConsent(me.id, {
    reservationId,
    face: fd.get("c_face") === "on",
    process: fd.get("c_process") === "on",
    beforeAfter: fd.get("c_ba") === "on",
    sns: fd.get("c_sns") === "on",
    ad: fd.get("c_ad") === "on",
    portfolio: fd.get("c_portfolio") === "on",
    ip,
  });

  await notify(proId, "reservation", "새 예약 요청",
    "새로운 예약 요청이 도착했어요. 확인해 주세요.", "reservation", reservationId);
  await logEvent(me.id, "reservation_create", { pro_id: proId });

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

  const parties = await getReservationParties(id);
  if (!parties) return;

  await setReservationStatus(id, status);

  if (status === "completed") {
    await logEvent(me.id, "reservation_complete", { reservation_id: id });
  }
  if (status === "no_show") {
    await incrementNoShow(parties.customerId);
  }

  const notifyTarget = me.id === parties.proId ? parties.customerId : parties.proId;
  await notify(notifyTarget, "reservation", "예약 상태 변경",
    NEXT_LABEL[status] ?? "예약 상태가 변경됐어요.", "reservation", id);

  revalidatePath("/app/my/reservations");
  revalidatePath("/pro/my/reservations");
}
