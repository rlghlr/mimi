"use server";

import { getSessionUser } from "@/lib/auth";
import { applyToPost } from "@/lib/data";
import { messageForError } from "@/lib/constants";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type ApplyState = { error?: string };

export async function applyAction(
  _prev: ApplyState,
  formData: FormData
): Promise<ApplyState> {
  const me = await getSessionUser();
  if (!me) return { error: "로그인이 필요해요." };
  const postId = String(formData.get("post_id") || "");

  const photos = {
    front: String(formData.get("photo_front") || ""),
    side: String(formData.get("photo_side") || ""),
    back: String(formData.get("photo_back") || ""),
  };
  const dates = String(formData.get("available_dates") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  try {
    await applyToPost(me.id, {
      postId,
      photos,
      currentState: String(formData.get("current_state") || "") || null,
      recentHistory: String(formData.get("recent_history") || "") || null,
      availableDates: dates,
      message: String(formData.get("message") || "") || null,
    });
  } catch (err) {
    return { error: messageForError(err) };
  }

  revalidatePath(`/app/posts/${postId}`);
  redirect("/app/my/applications?applied=1");
}
