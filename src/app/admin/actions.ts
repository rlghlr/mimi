"use server";

import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function assertAdmin() {
  const me = await getSessionUser();
  if (!me || me.role !== "admin") throw new Error("FORBIDDEN");
  return me;
}

export async function approveProAction(formData: FormData) {
  await assertAdmin();
  const userId = String(formData.get("user_id"));
  const supabase = createClient();

  await supabase
    .from("professional_profiles")
    .update({ approved: true, approved_at: new Date().toISOString() })
    .eq("user_id", userId);
  await supabase.from("users").update({ status: "active" }).eq("id", userId);

  await supabase.rpc("notify" as never, {
    p_user: userId, p_type: "approved", p_title: "전문가 승인 완료",
    p_body: "축하해요! 이제 모델 모집 공고를 등록할 수 있어요.",
  } as never);

  revalidatePath("/admin/pros");
}

export async function rejectProAction(formData: FormData) {
  await assertAdmin();
  const userId = String(formData.get("user_id"));
  const supabase = createClient();
  await supabase.from("users").update({ status: "suspended" }).eq("id", userId);
  await supabase.rpc("notify" as never, {
    p_user: userId, p_type: "rejected", p_title: "전문가 심사 반려",
    p_body: "제출하신 정보로는 승인이 어려워요. 프로필을 보완해 재심사를 요청해 주세요.",
  } as never);
  revalidatePath("/admin/pros");
}

export async function setUserStatusAction(formData: FormData) {
  await assertAdmin();
  const userId = String(formData.get("user_id"));
  const status = String(formData.get("status"));
  const supabase = createClient();
  await supabase.from("users").update({ status: status as never }).eq("id", userId);
  revalidatePath("/admin/members");
}
