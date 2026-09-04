import type { Client } from "@/lib/supabase/server";
import type { ChatMessageRow } from "@/lib/database.types";

export const CHAT_SELECT =
  "*, cust:customer_profiles!fk_chat_customer_profile(nickname, avatar_url), pro:professional_profiles!fk_chat_pro_profile(name, avatar_url, career)";

export type Peer = { id: string; name: string | null; avatar: string | null; sub?: string | null };

type RawChat = {
  id: string;
  customer_id: string;
  pro_id: string;
  last_message: string | null;
  last_message_at: string | null;
  blocked_by: string | null;
  cust: { nickname: string | null; avatar_url: string | null } | null;
  pro: { name: string | null; avatar_url: string | null; career: string | null } | null;
};

export type ChatListItem = {
  id: string;
  peer: Peer;
  last_message: string | null;
  last_message_at: string | null;
};

/** Resolve the "other side" of a chat for the current user. */
export function peerOf(c: RawChat, meId: string): Peer {
  const iAmCustomer = c.customer_id === meId;
  return iAmCustomer
    ? { id: c.pro_id, name: c.pro?.name ?? "전문가", avatar: c.pro?.avatar_url ?? null, sub: c.pro?.career }
    : { id: c.customer_id, name: c.cust?.nickname ?? "회원", avatar: c.cust?.avatar_url ?? null };
}

export async function loadChatList(supabase: Client, meId: string): Promise<ChatListItem[]> {
  const { data } = await supabase
    .from("chats")
    .select(CHAT_SELECT)
    .or(`customer_id.eq.${meId},pro_id.eq.${meId}`)
    .order("last_message_at", { ascending: false, nullsFirst: false });

  return ((data ?? []) as unknown as RawChat[]).map((c) => ({
    id: c.id,
    peer: peerOf(c, meId),
    last_message: c.last_message,
    last_message_at: c.last_message_at,
  }));
}

export async function loadChatRoom(supabase: Client, chatId: string, meId: string) {
  const { data: raw } = await supabase.from("chats").select(CHAT_SELECT).eq("id", chatId).single();
  if (!raw) return null;
  const c = raw as unknown as RawChat;
  if (c.customer_id !== meId && c.pro_id !== meId) return null;

  const { data: msgs } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true })
    .limit(200);

  return {
    chat: c,
    peer: peerOf(c, meId),
    messages: (msgs ?? []) as ChatMessageRow[],
    blocked: !!c.blocked_by,
  };
}
