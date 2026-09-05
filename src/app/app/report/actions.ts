"use server";

import { getSessionUser } from "@/lib/auth";
import { createReport, blockChat } from "@/lib/data";
import { messageForError } from "@/lib/constants";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ReportReason } from "@/lib/database.types";

export type ReportState = { error?: string };

export async function submitReportAction(_prev: ReportState, fd: FormData): Promise<ReportState> {
  const me = await getSessionUser();
  if (!me) return { error: "로그인이 필요해요." };

  try {
    await createReport(me.id, {
      targetType: String(fd.get("target_type") || "user"),
      targetId: String(fd.get("target_id") || ""),
      reason: String(fd.get("reason") || "other") as ReportReason,
      detail: String(fd.get("detail") || "") || null,
    });
  } catch (err) {
    return { error: messageForError(err) };
  }

  // optionally block the chat as well
  const chatId = String(fd.get("chat_id") || "");
  if (chatId && fd.get("block") === "on") {
    await blockChat(chatId, me.id);
  }

  const back = String(fd.get("back") || "/app");
  redirect(`${back}?reported=1`);
}

export async function blockChatAction(formData: FormData) {
  const chatId = String(formData.get("chat_id"));
  const me = (await getSessionUser())!;
  await blockChat(chatId, me.id);
  revalidatePath(`/app/chats/${chatId}`);
  revalidatePath(`/pro/chats/${chatId}`);
}
