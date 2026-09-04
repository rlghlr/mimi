"use server";

import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { messageForError } from "@/lib/constants";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ReportReason } from "@/lib/database.types";

export type ReportState = { error?: string };

export async function submitReportAction(_prev: ReportState, fd: FormData): Promise<ReportState> {
  const me = await getSessionUser();
  if (!me) return { error: "로그인이 필요해요." };
  const supabase = createClient();

  const { error } = await supabase.from("reports").insert({
    reporter_id: me.id,
    target_type: String(fd.get("target_type") || "user"),
    target_id: String(fd.get("target_id") || ""),
    reason: (String(fd.get("reason") || "other") as ReportReason),
    detail: String(fd.get("detail") || "") || null,
    status: "received",
  });
  if (error) return { error: messageForError(error) };

  // optionally block the chat as well
  const chatId = String(fd.get("chat_id") || "");
  if (chatId && fd.get("block") === "on") {
    await supabase.from("chats").update({ blocked_by: me.id }).eq("id", chatId);
  }

  const back = String(fd.get("back") || "/app");
  redirect(`${back}?reported=1`);
}

export async function blockChatAction(formData: FormData) {
  const chatId = String(formData.get("chat_id"));
  const me = (await getSessionUser())!;
  const supabase = createClient();
  await supabase.from("chats").update({ blocked_by: me.id }).eq("id", chatId);
  revalidatePath(`/app/chats/${chatId}`);
  revalidatePath(`/pro/chats/${chatId}`);
}
