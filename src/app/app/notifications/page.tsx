import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { listNotifications } from "@/lib/reads";
import { markAllNotificationsRead } from "@/lib/data";
import { Empty } from "@/components/ui";
import { timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Notifications() {
  const me = (await getSessionUser())!;

  const data = await listNotifications(me.id, 50);

  // mark all read (best-effort)
  await markAllNotificationsRead(me.id);

  const back = me.role === "professional" ? "/pro" : "/app";

  return (
    <div className="pb-8">
      <header className="sticky top-0 z-20 bg-ground/95 backdrop-blur px-4 py-3 flex items-center gap-2">
        <Link href={back} aria-label="뒤로" className="p-1 text-ink-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <span className="font-semibold">알림</span>
      </header>

      {!data || data.length === 0 ? (
        <Empty icon="🔔" text="새로운 알림이 없어요." />
      ) : (
        <ul className="px-3 py-2">
          {data.map((n) => (
            <li key={n.id} className="flex gap-3 px-3 py-3.5 border-b border-border">
              <div className="w-2 h-2 rounded-full bg-accent mt-1.5 shrink-0"
                style={{ opacity: n.read_at ? 0.2 : 1 }} />
              <div className="flex-1">
                <div className="font-semibold text-[14px]">{n.title}</div>
                {n.body && <div className="text-[13px] text-ink-2 mt-0.5">{n.body}</div>}
                <div className="text-[11px] text-ink-3 mt-1">{timeAgo(n.created_at)}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
