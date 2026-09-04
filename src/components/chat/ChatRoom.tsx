"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui";
import { clsx } from "@/lib/clsx";
import { won } from "@/lib/format";
import type { ChatMessageRow } from "@/lib/database.types";

type Peer = { id: string; name: string | null; avatar: string | null; sub?: string | null };
type Props = {
  chatId: string;
  meId: string;
  role: "customer" | "professional";
  peer: Peer;
  initial: ChatMessageRow[];
  blocked: boolean;
  backHref: string;
  cta: { label: string; href: string } | null;
};

const OFFERS = [
  { type: "price_offer", label: "가격 제안", icon: "₩" },
  { type: "date_offer", label: "날짜 제안", icon: "📅" },
  { type: "location", label: "위치 공유", icon: "📍" },
] as const;

export function ChatRoom({ chatId, meId, role, peer, initial, blocked, backHref, cta }: Props) {
  const supabase = createClient();
  const [messages, setMessages] = useState<ChatMessageRow[]>(initial);
  const [text, setText] = useState("");
  const [sheet, setSheet] = useState<null | (typeof OFFERS)[number]["type"]>(null);
  const [, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const channel = supabase
      .channel(`chat:${chatId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `chat_id=eq.${chatId}` },
        (payload) => {
          const m = payload.new as ChatMessageRow;
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, supabase]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(type: ChatMessageRow["type"], body: string, payload: Record<string, unknown> = {}) {
    if (blocked) return;
    // optimistic
    const temp: ChatMessageRow = {
      id: `temp-${Date.now()}`, chat_id: chatId, sender_id: meId, type,
      body, payload, read_at: null, created_at: new Date().toISOString(),
    };
    setMessages((p) => [...p, temp]);
    startTransition(() => {});
    await supabase.from("chat_messages").insert({ chat_id: chatId, sender_id: meId, type, body, payload });
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    setText("");
    void send("text", t);
  }

  return (
    <div className="app-shell flex flex-col h-dvh">
      {/* header: pinned peer profile */}
      <header className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-surface">
        <Link href={backHref} aria-label="뒤로" className="p-1 text-ink-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <Avatar src={peer.avatar} name={peer.name} size={36} />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-[15px] truncate">{peer.name ?? "상대방"}</div>
          {peer.sub && <div className="text-[11px] text-ink-3 truncate">{peer.sub}</div>}
        </div>
        <Link
          href={`/app/report?type=user&id=${peer.id}&chat=${chatId}&back=${encodeURIComponent(backHref)}`}
          aria-label="신고·차단"
          className="p-1.5 text-ink-3"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="12" cy="19" r="1.6" /></svg>
        </Link>
      </header>

      {/* messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2.5 bg-ground">
        {messages.map((m) => (
          <Bubble key={m.id} m={m} mine={m.sender_id === meId} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* CTA bar */}
      {cta && (
        <div className="px-4 py-2 border-t border-border bg-surface">
          <Link href={cta.href} className="btn-primary w-full py-2.5">{cta.label}</Link>
        </div>
      )}

      {/* composer */}
      {blocked ? (
        <div className="px-4 py-4 text-center text-[13px] text-ink-3 border-t border-border bg-surface">
          차단된 대화예요. 메시지를 보낼 수 없어요.
        </div>
      ) : (
        <>
          {sheet && <OfferSheet type={sheet} onClose={() => setSheet(null)} onSend={send} />}
          <form onSubmit={onSubmit} className="flex items-center gap-2 px-3 py-2.5 border-t border-border bg-surface">
            <div className="flex gap-1">
              {OFFERS.map((o) => (
                <button key={o.type} type="button" onClick={() => setSheet(o.type)}
                  className="w-9 h-9 rounded-full bg-surface-2 grid place-items-center text-[15px]"
                  aria-label={o.label} title={o.label}>
                  {o.icon}
                </button>
              ))}
            </div>
            <input value={text} onChange={(e) => setText(e.target.value)} className="field flex-1 py-2.5"
              placeholder="메시지 입력" />
            <button type="submit" className="btn-primary px-4 py-2.5" disabled={!text.trim()}>전송</button>
          </form>
        </>
      )}
    </div>
  );
}

function Bubble({ m, mine }: { m: ChatMessageRow; mine: boolean }) {
  if (m.type === "system") {
    return <div className="self-center text-[11px] text-ink-3 bg-surface-2 rounded-full px-3 py-1">{m.body}</div>;
  }
  const payload = (m.payload ?? {}) as Record<string, unknown>;
  const special =
    m.type === "price_offer" ? `💰 시술 가격 제안: ${won(Number(payload.amount))}` :
    m.type === "date_offer" ? `📅 시술 날짜 제안: ${payload.date}` :
    m.type === "location" ? `📍 위치: ${payload.place}` :
    m.type === "reservation_offer" ? `📋 예약 제안` : null;

  return (
    <div className={clsx("max-w-[76%] flex flex-col", mine ? "self-end items-end" : "self-start items-start")}>
      <div className={clsx(
        "px-3.5 py-2.5 rounded-2xl text-[14px] leading-relaxed whitespace-pre-wrap",
        mine ? "bg-accent text-white rounded-br-md" : "bg-surface border border-border rounded-bl-md"
      )}>
        {special ? <b className="font-semibold">{special}</b> : m.type === "image"
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={m.body ?? ""} alt="" className="rounded-lg max-w-full" />
          : m.body}
      </div>
    </div>
  );
}

function OfferSheet({
  type, onClose, onSend,
}: {
  type: (typeof OFFERS)[number]["type"];
  onClose: () => void;
  onSend: (t: ChatMessageRow["type"], body: string, payload: Record<string, unknown>) => Promise<void>;
}) {
  const [val, setVal] = useState("");
  const cfg = {
    price_offer: { title: "가격 제안", ph: "금액(원)", type: "number", body: (v: string) => `가격 제안 ${won(Number(v))}`, payload: (v: string) => ({ amount: Number(v) }) },
    date_offer: { title: "날짜 제안", ph: "예: 3/8 오후 2시", type: "text", body: (v: string) => `날짜 제안 ${v}`, payload: (v: string) => ({ date: v }) },
    location: { title: "위치 공유", ph: "장소/주소", type: "text", body: (v: string) => `위치 ${v}`, payload: (v: string) => ({ place: v }) },
  }[type];

  return (
    <div className="fixed inset-0 z-40 bg-ink/40 flex items-end" onClick={onClose}>
      <div className="max-w-app w-full mx-auto bg-surface rounded-t-2xl p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-bold mb-3">{cfg.title}</h3>
        <input autoFocus value={val} onChange={(e) => setVal(e.target.value)} type={cfg.type}
          className="field mb-3" placeholder={cfg.ph} />
        <button className="btn-primary w-full" disabled={!val.trim()}
          onClick={async () => { await onSend(type, cfg.body(val), cfg.payload(val)); onClose(); }}>
          보내기
        </button>
      </div>
    </div>
  );
}
