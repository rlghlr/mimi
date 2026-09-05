"use server";

import { getSessionUser } from "@/lib/auth";
import { getProApproved, createRecruitPost, updatePostStatus } from "@/lib/data";
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

  // guard: approved pros only
  if (!(await getProApproved(me.id))) return { error: "운영자 승인 후 공고를 등록할 수 있어요." };

  const title = String(fd.get("title") || "").trim();
  if (!title) return { error: "모집 제목을 입력해 주세요." };

  let postId: string;
  try {
    postId = await createRecruitPost(me.id, {
      categoryId: String(fd.get("category_id") || "") || null,
      title,
      detail: String(fd.get("detail") || "") || null,
      beforeCondition: String(fd.get("before_condition") || "") || null,
      modelConditions: {
        gender: String(fd.get("cond_gender") || ""),
        age: String(fd.get("cond_age") || ""),
        hair_length: String(fd.get("cond_hair") || ""),
        history: String(fd.get("cond_history") || ""),
      },
      headcount: Number(fd.get("headcount") || 1),
      place: String(fd.get("place") || "") || null,
      address: String(fd.get("address") || "") || null,
      region: String(fd.get("region") || "") || null,
      sessionDate: String(fd.get("session_date") || "") || null,
      sessionTime: String(fd.get("session_time") || "") || null,
      durationMin: fd.get("duration_min") ? Number(fd.get("duration_min")) : null,
      costType: String(fd.get("cost_type") || "free") as CostType,
      payAmount: Number(fd.get("pay_amount") || 0),
      chargeAmount: Number(fd.get("charge_amount") || 0),
      referenceImages: urls(fd, "reference_images"),
      agreements: {
        sns: fd.get("agree_sns") === "on",
        photo: fd.get("agree_photo") === "on",
        video: fd.get("agree_video") === "on",
        before_after: fd.get("agree_ba") === "on",
      },
      isUrgent: fd.get("is_urgent") === "on",
      status: "recruiting",
    });
  } catch (err) {
    return { error: messageForError(err) };
  }

  revalidatePath("/pro");
  redirect(`/pro/posts/${postId}/applicants`);
}

export async function updatePostStatusAction(postId: string, status: string) {
  await updatePostStatus(postId, status);
  revalidatePath(`/pro/posts/${postId}/applicants`);
  revalidatePath("/pro/posts");
}
