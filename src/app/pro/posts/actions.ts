"use server";

import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { messageForError } from "@/lib/constants";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { CostType } from "@/lib/database.types";

export type PostFormState = { error?: string };

function urls(fd: FormData, key: string): string[] {
  return String(fd.get(key) || "")
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function createPostAction(
  _prev: PostFormState,
  fd: FormData
): Promise<PostFormState> {
  const me = await getSessionUser();
  if (!me) return { error: "로그인이 필요해요." };
  const supabase = createClient();

  // guard: approved pros only
  const { data: profile } = await supabase
    .from("professional_profiles")
    .select("approved")
    .eq("user_id", me.id)
    .single();
  if (!profile?.approved) return { error: "운영자 승인 후 공고를 등록할 수 있어요." };

  const title = String(fd.get("title") || "").trim();
  if (!title) return { error: "모집 제목을 입력해 주세요." };

  const { data, error } = await supabase
    .from("recruit_posts")
    .insert({
      pro_id: me.id,
      category_id: String(fd.get("category_id") || "") || null,
      title,
      detail: String(fd.get("detail") || "") || null,
      before_condition: String(fd.get("before_condition") || "") || null,
      model_conditions: {
        gender: String(fd.get("cond_gender") || ""),
        age: String(fd.get("cond_age") || ""),
        hair_length: String(fd.get("cond_hair") || ""),
        history: String(fd.get("cond_history") || ""),
      },
      headcount: Number(fd.get("headcount") || 1),
      place: String(fd.get("place") || "") || null,
      address: String(fd.get("address") || "") || null,
      region: String(fd.get("region") || "") || null,
      session_date: String(fd.get("session_date") || "") || null,
      session_time: String(fd.get("session_time") || "") || null,
      duration_min: fd.get("duration_min") ? Number(fd.get("duration_min")) : null,
      cost_type: (String(fd.get("cost_type") || "free") as CostType),
      pay_amount: Number(fd.get("pay_amount") || 0),
      charge_amount: Number(fd.get("charge_amount") || 0),
      reference_images: urls(fd, "reference_images"),
      agreements: {
        sns: fd.get("agree_sns") === "on",
        photo: fd.get("agree_photo") === "on",
        video: fd.get("agree_video") === "on",
        before_after: fd.get("agree_ba") === "on",
      },
      is_urgent: fd.get("is_urgent") === "on",
      status: "recruiting",
    })
    .select("id")
    .single();

  if (error) return { error: messageForError(error) };

  revalidatePath("/pro");
  redirect(`/pro/posts/${data!.id}/applicants`);
}

export async function updatePostStatusAction(postId: string, status: string) {
  const supabase = createClient();
  await supabase.from("recruit_posts").update({ status: status as never }).eq("id", postId);
  revalidatePath(`/pro/posts/${postId}/applicants`);
  revalidatePath("/pro/posts");
}
