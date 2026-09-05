import { adminDashboard } from "@/lib/reads";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const { stats: s, funnel: f } = await adminDashboard();

  const stats = [
    { label: "전체 회원", value: s.users },
    { label: "전문가", value: s.pros },
    { label: "승인 대기", value: s.pendingPros, tone: "warn" },
    { label: "오늘 가입", value: s.newToday },
    { label: "등록 공고", value: s.posts },
    { label: "총 지원", value: s.applications },
    { label: "매칭 완료", value: s.matches },
    { label: "예약", value: s.reservations },
  ];

  const funnel = [
    ["방문", f.visit], ["가입", f.signup], ["지원", f.apply], ["채팅", f.chat],
    ["매칭", f.match], ["예약", f.reserve], ["시술완료", f.complete],
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
