"use server";

import { getSessionUser } from "@/lib/auth";
import { adminApprovePro, adminSetUserStatus, notify } from "@/lib/data";
import { revalidatePath } from "next/cache";

async function assertAdmin() {
  const me = await getSessionUser();
  if (!me || me.role !== "admin") throw new Error("FORBIDDEN");
  return me;
}

export async function approveProAction(formData: FormData) {
  await assertAdmin();
  const userId = String(formData.get("user_id"));

  await adminApprovePro(userId);
  await notify(userId, "approved", "전문가 승인 완료",
    "축하해요! 이제 모델 모집 공고를 등록할 수 있어요.");

  revalidatePath("/admin/pros");
}

export async function rejectProAction(formData: FormData) {
  await assertAdmin();
  const userId = String(formData.get("user_id"));

  await adminSetUserStatus(userId, "suspended");
  await notify(userId, "rejected", "전문가 심사 반려",
    "제출하신 정보로는 승인이 어려워요. 프로필을 보완해 재심사를 요청해 주세요.");

  revalidatePath("/admin/pros");
}

export async function setUserStatusAction(formData: FormData) {
  await assertAdmin();
  const userId = String(formData.get("user_id"));
  const status = String(formData.get("status"));

  await adminSetUserStatus(userId, status);
  revalidatePath("/admin/members");
}
