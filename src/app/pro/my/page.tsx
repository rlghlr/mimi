import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { getProProfileCard, getCreditBalance } from "@/lib/reads";
import { Avatar, Badge } from "@/components/ui";
import { signOutAction } from "@/app/(auth)/actions";

export const dynamic = "force-dynamic";

const MENU = [
  { href: "/pro/posts", label: "모집공고", icon: "📢" },
  { href: "/pro/my/reservations", label: "예약관리", icon: "📅" },
  { href: "/pro/my/portfolio", label: "포트폴리오", icon: "🖼️" },
  { href: "/pro/my/reviews", label: "리뷰", icon: "★" },
  { href: "/pro/my/credits", label: "크레딧", icon: "🪙" },
  { href: "/pro/notifications", label: "알림", icon: "🔔" },
];

export default async function ProMy() {
  const me = (await getSessionUser())!;
  const [p, balance] = await Promise.all([
    getProProfileCard(me.id),
    getCreditBalance(me.id),
  ]);
  const credit = { balance };

  return (
    <div className="pb-10">
      <header className="px-5 pt-5 pb-3"><h1 className="text-xl font-bold">MY</h1></header>

      <Link href="/pro/my/profile" className="mx-5 card p-4 flex items-center gap-3">
        <Avatar src={p?.avatar_url} name={p?.name} size={56} />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[17px]">{p?.name ?? "전문가"}</span>
            {p?.approved ? <Badge tone="good">승인</Badge> : <Badge tone="warn">승인대기</Badge>}
          </div>
          <div className="text-[13px] text-ink-3">
            {p?.region ?? "지역 미설정"} · ★ {p?.rating_avg ? Number(p.rating_avg).toFixed(1) : "–"} ({p?.review_count ?? 0})
          </div>
        </div>
        <span className="text-ink-3">›</span>
      </Link>

      <Link href="/pro/my/credits" className="mx-5 mt-3 card p-4 flex items-center justify-between bg-gold-soft border-gold/30">
        <div className="flex items-center gap-2">
          <span className="text-xl">🪙</span>
          <span className="font-semibold text-[14px]">Muse Credit</span>
        </div>
        <span className="font-display text-lg text-gold">{credit?.balance ?? 0}</span>
      </Link>

      <ul className="mt-6 px-5 grid grid-cols-3 gap-3">
        {MENU.map((m) => (
          <li key={m.href}>
            <Link href={m.href} className="card p-4 flex flex-col items-center gap-1.5 text-center">
              <span className="text-xl">{m.icon}</span>
              <span className="text-[12px] font-medium">{m.label}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="px-5 mt-8 flex flex-col gap-2 text-[13px] text-ink-3">
        <Link href="/pro/my/settings" className="py-2">설정</Link>
        <form action={signOutAction}><button className="py-2 text-ink-3">로그아웃</button></form>
      </div>
    </div>
  );
}
