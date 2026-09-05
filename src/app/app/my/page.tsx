import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { getCustomerProfile } from "@/lib/reads";
import { Avatar } from "@/components/ui";
import { signOutAction } from "@/app/(auth)/actions";

export const dynamic = "force-dynamic";

const MENU = [
  { href: "/app/my/applications", label: "지원 내역", icon: "📝" },
  { href: "/app/my/reservations", label: "예약 내역", icon: "📅" },
  { href: "/app/consult", label: "내 상담", icon: "💬" },
  { href: "/app/my/favorites", label: "찜", icon: "♡" },
  { href: "/app/my/reviews", label: "내 리뷰", icon: "★" },
  { href: "/app/notifications", label: "알림", icon: "🔔" },
];

export default async function CustomerMy() {
  const me = (await getSessionUser())!;
  const p = await getCustomerProfile(me.id);

  return (
    <div className="pb-10">
      <header className="px-5 pt-5 pb-3">
        <h1 className="text-xl font-bold">MY</h1>
      </header>

      <Link href="/app/my/profile" className="mx-5 card p-4 flex items-center gap-3">
        <Avatar src={p?.avatar_url} name={p?.nickname} size={56} />
        <div className="flex-1">
          <div className="font-bold text-[17px]">{p?.nickname ?? "회원"}</div>
          <div className="text-[13px] text-ink-3">{p?.region ?? "지역 미설정"} · 프로필 편집</div>
        </div>
        <span className="text-ink-3">›</span>
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
        <Link href="/app/my/settings" className="py-2">설정</Link>
        <Link href="/app/my/reports" className="py-2">신고 내역</Link>
        <form action={signOutAction}>
          <button className="py-2 text-ink-3">로그아웃</button>
        </form>
      </div>
    </div>
  );
}
