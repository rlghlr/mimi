import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { signOutAction } from "@/app/(auth)/actions";
import { BRAND } from "@/lib/constants";

const NAV = [
  { href: "/admin", label: "대시보드", icon: "▤" },
  { href: "/admin/members", label: "회원관리", icon: "◍" },
  { href: "/admin/pros", label: "전문가 승인", icon: "✓" },
  { href: "/admin/posts", label: "공고관리", icon: "▦" },
  { href: "/admin/reports", label: "신고관리", icon: "⚑" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const me = await getSessionUser();
  if (!me) redirect("/login");
  if (me.role !== "admin") redirect("/");

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[240px_1fr] bg-ground">
      <aside className="md:sticky md:top-0 md:h-dvh border-b md:border-b-0 md:border-r border-border bg-surface flex md:flex-col">
        <div className="p-5 md:pb-8">
          <div className="font-display text-2xl flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-accent inline-block" />
            {BRAND.name}
          </div>
          <div className="text-[11px] tracking-widest uppercase text-ink-3 mt-1 hidden md:block">Admin Console</div>
        </div>
        <nav className="flex md:flex-col gap-1 px-2 md:px-3 overflow-x-auto flex-1">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[14px] text-ink-2 hover:bg-surface-2 hover:text-ink whitespace-nowrap">
              <span className="text-ink-3 w-4 text-center">{n.icon}</span>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 hidden md:block">
          <form action={signOutAction}>
            <button className="text-[13px] text-ink-3 px-3 py-2">로그아웃</button>
          </form>
        </div>
      </aside>
      <main className="min-w-0">{children}</main>
    </div>
  );
}
