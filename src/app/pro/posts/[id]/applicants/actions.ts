"use server";

import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { messageForError } from "@/lib/constants";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/** Pro opens a chat with an applicant → marks application 'chatting'. */
export async function startChatAction(formData: FormData) {
  const applicationId = String(formData.get("application_id"));
  const applicantId = String(formData.get("applicant_id"));
  const postId = String(formData.get("post_id"));
  const me = (await getSessionUser())!;
  const supabase = createClient();

  const { data: chat, error } = await supabase.rpc("open_chat", {
    p_customer: applicantId,
    p_pro: me.id,
  });
  if (error || !chat) return;

  await supabase
    .from("recruit_applications")
    .update({ status: "chatting" })
    .eq("id", applicationId)
    .in("status", ["applied", "reviewing"]);

  await supabase.rpc("notify" as never, {
    p_user: applicantId,
    p_type: "chat",
    p_title: "전문가가 대화를 시작했어요",
    p_body: "지원하신 공고에 대해 전문가가 채팅을 시작했어요.",
    p_ref_type: "chat",
    p_ref_id: chat.id,
  } as never);

  revalidatePath(`/pro/posts/${postId}/applicants`);
  redirect(`/pro/chats/${chat.id}`);
}

/** Reject an applicant → 'rejected' + notify. */
export async function rejectApplicantAction(formData: FormData) {
  const applicationId = String(formData.get("application_id"));
  const applicantId = String(formData.get("applicant_id"));
  const postId = String(formData.get("post_id"));
  const supabase = createClient();

  await supabase.from("recruit_applications").update({ status: "rejected" }).eq("id", applicationId);
  await supabase.rpc("notify" as never, {
    p_user: applicantId,
    p_type: "rejected",
    p_title: "이번 모집 결과 안내",
    p_body: "아쉽지만 이번 모집에는 선정되지 않았어요.",
    p_ref_type: "post",
    p_ref_id: postId,
  } as never);

  revalidatePath(`/pro/posts/${postId}/applicants`);
}

/** Confirm a match with an applicant (atomic RPC handles headcount). */
export async function confirmMatchAction(formData: FormData) {
  const applicantId = String(formData.get("applicant_id"));
  const postId = String(formData.get("post_id"));
  const supabase = createClient();

  const { error } = await supabase.rpc("confirm_match", {
    p_type: "recruit",
    p_source_id: postId,
    p_customer: applicantId,
  });
  if (error) {
    // surface via query param
    redirect(`/pro/posts/${postId}/applicants?err=${encodeURIComponent(messageForError(error))}`);
  }
  revalidatePath(`/pro/posts/${postId}/applicants`);
}
