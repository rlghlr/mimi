"use server";

import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";

/** Customer starts a chat ("상담하기") with a professional. */
export async function startChatWithProAction(formData: FormData) {
  const proId = String(formData.get("pro_id"));
  const me = (await getSessionUser())!;
  const supabase = createClient();
  const { data: chat, error } = await supabase.rpc("open_chat", { p_customer: me.id, p_pro: proId });
  if (error || !chat) return;
  redirect(`/app/chats/${chat.id}`);
}
