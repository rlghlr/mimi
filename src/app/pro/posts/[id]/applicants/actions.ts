"use server";

import { getSessionUser } from "@/lib/auth";
import { setApplicationStatus, confirmMatch, notify } from "@/lib/data";
import { messageForError } from "@/lib/constants";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/** Reject an applicant → 'rejected' + notify. */
export async function rejectApplicantAction(formData: FormData) {
  const applicationId = String(formData.get("application_id"));
  const applicantId = String(formData.get("applicant_id"));
  const postId = String(formData.get("post_id"));

  await setApplicationStatus(applicationId, "rejected");
  await notify(applicantId, "rejected", "이번 모집 결과 안내",
    "아쉽지만 이번 모집에는 선정되지 않았어요.", "post", postId);

  revalidatePath(`/pro/posts/${postId}/applicants`);
}

/** Confirm a match with an applicant (headcount handled server-side). */
export async function confirmMatchAction(formData: FormData) {
  const applicantId = String(formData.get("applicant_id"));
  const postId = String(formData.get("post_id"));
  const me = (await getSessionUser())!;

  try {
    await confirmMatch(me.id, postId, applicantId, "recruit");
  } catch (err) {
    redirect(`/pro/posts/${postId}/applicants?err=${encodeURIComponent(messageForError(err))}`);
  }
  revalidatePath(`/pro/posts/${postId}/applicants`);
}
