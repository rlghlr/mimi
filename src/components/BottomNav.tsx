"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "@/lib/clsx";

type Item = { href: string; label: string; icon: string };

const CUSTOMER: Item[] = [
  { href: "/app", label: "홈", icon: "M3 11l9-8 9 8v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z" },
  { href: "/app/posts", label: "공고", icon: "M4 5h16v3H4zM4 10.5h16v3H4zM4 16h10v3H4z" },
  { href: "/app/consult", label: "상담", icon: "M4 4h16v11H8l-4 4z" },
  { href: "/app/chats", label: "채팅", icon: "M4 4h16v12H7l-3 3zM8 9h8M8 12h5" },
  { href: "/app/my", label: "MY", icon: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0z" },
];

const PRO: Item[] = [
  { href: "/pro", label: "홈", icon: "M3 11l9-8 9 8v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z" },
  { href: "/pro/models", label: "모델찾기", icon: "M11 4a7 7 0 105 12l4 4M11 4a7 7 0 010 14" },
  { href: "/pro/posts/new", label: "공고등록", icon: "M12 5v14M5 12h14" },
  { href: "/pro/chats", label: "채팅", icon: "M4 4h16v12H7l-3 3zM8 9h8M8 12h5" },
  { href: "/pro/my", label: "MY", icon: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0z" },
];

export function BottomNav({ variant }: { variant: "customer" | "professional" }) {
  const pathname = usePathname();
  const items = variant === "professional" ? PRO : CUSTOMER;
  const isCreate = (href: string) => href.endsWith("/new");

  return (
    <nav className="sticky bottom-0 z-30 bg-surface/95 backdrop-blur border-t border-border">
      <ul className="grid grid-cols-5 max-w-app mx-auto">
        {items.map((it) => {
          const active =
            it.href === "/app" || it.href === "/pro"
              ? pathname === it.href
              : pathname.startsWith(it.href);
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                className={clsx(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium",
                  active ? "text-accent" : "text-ink-3"
                )}
              >
                {isCreate(it.href) ? (
                  <span className="w-9 h-9 -mt-4 rounded-full bg-accent text-white grid place-items-center shadow-pop">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                      <path d={it.icon} />
                    </svg>
                  </span>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"
                    strokeLinejoin="round">
                    <path d={it.icon} />
                  </svg>
                )}
                <span>{it.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
