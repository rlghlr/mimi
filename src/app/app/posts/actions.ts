"use server";

import { createClient } from "@/lib/supabase/server";
import { messageForError } from "@/lib/constants";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type ApplyState = { error?: string };

export async function applyAction(
  _prev: ApplyState,
  formData: FormData
): Promise<ApplyState> {
  const postId = String(formData.get("post_id") || "");
  const supabase = createClient();

  const photos = {
    front: String(formData.get("photo_front") || ""),
    side: String(formData.get("photo_side") || ""),
    back: String(formData.get("photo_back") || ""),
  };
  const dates = String(formData.get("available_dates") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const { error } = await supabase.rpc("apply_to_post", {
    p_post_id: postId,
    p_photos: photos,
    p_current_state: String(formData.get("current_state") || "") || undefined,
    p_recent_history: String(formData.get("recent_history") || "") || undefined,
    p_available_dates: dates,
    p_message: String(formData.get("message") || "") || undefined,
  });

  if (error) return { error: messageForError(error) };

  revalidatePath(`/app/posts/${postId}`);
  redirect("/app/my/applications?applied=1");
}
