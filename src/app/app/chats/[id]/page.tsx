import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { loadChatRoom } from "@/lib/chat";
import { ChatRoom } from "@/components/chat/ChatRoom";

export const dynamic = "force-dynamic";

export default async function CustomerChatRoom({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const me = (await getSessionUser())!;
  const room = await loadChatRoom(supabase, params.id, me.id);
  if (!room) notFound();

  return (
    <ChatRoom
      chatId={params.id}
      meId={me.id}
      role="customer"
      peer={room.peer}
      initial={room.messages}
      blocked={room.blocked}
      backHref="/app/chats"
      cta={null}
    />
  );
}
