import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function count(
  supabase: ReturnType<typeof createClient>,
  table: string,
  build?: (q: any) => any
): Promise<number> {
  let q = supabase.from(table as never).select("id", { count: "exact", head: true });
  if (build) q = build(q);
  const { count } = await q;
  return count ?? 0;
}

export default async function AdminDashboard() {
  const supabase = createClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const iso = today.toISOString();

  const [
    users, pros, pendingPros, posts, applications, matches, reservations,
    tVisit, tSignup, tApply, tChat, tMatch, tReserve, tComplete,
  ] = await Promise.all([
    count(supabase, "users"),
    count(supabase, "users", (q) => q.eq("role", "professional")),
    count(supabase, "users", (q) => q.eq("role", "professional").eq("status", "pending")),
    count(supabase, "recruit_posts"),
    count(supabase, "recruit_applications"),
    count(supabase, "matches", (q) => q.eq("status", "confirmed")),
    count(supabase, "reservations"),
    // funnel (events, all-time)
    count(supabase, "events", (q) => q.eq("name", "visit")),
    count(supabase, "events", (q) => q.eq("name", "signup")),
    count(supabase, "events", (q) => q.eq("name", "apply")),
    count(supabase, "events", (q) => q.eq("name", "chat_open")),
    count(supabase, "events", (q) => q.eq("name", "match_confirm")),
    count(supabase, "events", (q) => q.eq("name", "reservation_create")),
    count(supabase, "events", (q) => q.eq("name", "reservation_complete")),
  ]);

  // today's new users
  const newToday = await count(supabase, "users", (q) => q.gte("created_at", iso));

  const stats = [
    { label: "전체 회원", value: users },
    { label: "전문가", value: pros },
    { label: "승인 대기", value: pendingPros, tone: "warn" },
    { label: "오늘 가입", value: newToday },
    { label: "등록 공고", value: posts },
    { label: "총 지원", value: applications },
    { label: "매칭 완료", value: matches },
    { label: "예약", value: reservations },
  ];

  const funnel = [
    ["방문", tVisit], ["가입", tSignup], ["지원", tApply], ["채팅", tChat],
    ["매칭", tMatch], ["예약", tReserve], ["시술완료", tComplete],
  ] as const;
  const fMax = Math.max(1, ...funnel.map(([, v]) => v));

  return (
    <div className="p-6 md:p-10 max-w-5xl">
      <h1 className="font-display text-3xl mb-1">대시보드</h1>
      <p className="text-ink-3 text-sm mb-8">서비스 핵심 지표 · 실시간</p>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        {stats.map((s) => (
          <div key={s.label} className="card p-4">
            <div className="text-[12px] text-ink-3">{s.label}</div>
            <div className={`font-display text-3xl mt-1 ${s.tone === "warn" ? "text-warn" : "text-ink"}`}
              style={{ fontVariantNumeric: "tabular-nums" }}>
              {s.value.toLocaleString("ko-KR")}
            </div>
          </div>
        ))}
      </section>

      <section className="card p-5 md:p-6">
        <h2 className="font-bold text-lg mb-5">핵심 Funnel</h2>
        <div className="flex flex-col gap-2.5">
          {funnel.map(([label, v]) => (
            <div key={label} className="flex items-center gap-3">
              <span className="w-16 text-[13px] text-ink-2 shrink-0">{label}</span>
              <div className="flex-1 h-7 bg-surface-2 rounded-md overflow-hidden">
                <div className="h-full bg-accent rounded-md transition-all"
                  style={{ width: `${(v / fMax) * 100}%`, minWidth: v > 0 ? "8%" : "0" }} />
              </div>
              <span className="w-12 text-right text-[13px] font-semibold tabular-nums">{v}</span>
            </div>
          ))}
        </div>
        <p className="text-[12px] text-ink-3 mt-4">
          방문 → 가입 → 공고조회 → 지원 → 채팅 → 매칭 → 예약 → 시술완료
        </p>
      </section>
    </div>
  );
}
