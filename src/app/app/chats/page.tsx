import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { loadChatList } from "@/lib/chat";
import { ChatList } from "@/components/chat/ChatList";

export const dynamic = "force-dynamic";

export default async function CustomerChats() {
  const supabase = createClient();
  const me = (await getSessionUser())!;
  const items = await loadChatList(supabase, me.id);
  return <ChatList items={items} base="/app/chats" />;
}
