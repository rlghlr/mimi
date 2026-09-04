import Link from "next/link";
import { Avatar, Empty } from "@/components/ui";
import { timeAgo } from "@/lib/format";
import type { ChatListItem } from "@/lib/chat";

export function ChatList({ items, base }: { items: ChatListItem[]; base: string }) {
  return (
    <div className="pb-8">
      <header className="sticky top-0 z-20 bg-ground/95 backdrop-blur px-5 pt-4 pb-3">
        <h1 className="text-xl font-bold">채팅</h1>
      </header>
      {items.length === 0 ? (
        <Empty icon="💬" text="아직 대화가 없어요. 지원·제안 후 대화가 시작돼요." />
      ) : (
        <ul className="px-3">
          {items.map((c) => (
            <li key={c.id}>
              <Link href={`${base}/${c.id}`} className="flex items-center gap-3 px-2 py-3 rounded-xl hover:bg-surface-2">
                <Avatar src={c.peer.avatar} name={c.peer.name} size={48} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[15px] truncate">{c.peer.name}</div>
                  <div className="text-[13px] text-ink-3 truncate">{c.last_message ?? "대화를 시작해 보세요"}</div>
                </div>
                <span className="text-[11px] text-ink-3 shrink-0">{timeAgo(c.last_message_at)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
