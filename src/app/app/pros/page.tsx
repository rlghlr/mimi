import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Avatar, Badge, Empty } from "@/components/ui";
import { CATEGORY_LABELS } from "@/lib/constants";
import { clsx } from "@/lib/clsx";
import type { CategoryType } from "@/lib/database.types";

export const dynamic = "force-dynamic";

const CATS = Object.entries(CATEGORY_LABELS);
const SORTS = [
  { key: "rating", label: "평점순" },
  { key: "reviews", label: "리뷰순" },
  { key: "recent", label: "최신순" },
] as const;

export default async function ProsPage({
  searchParams,
}: {
  searchParams: { cat?: string; sort?: string; q?: string };
}) {
  const supabase = createClient();
  const { cat, sort = "rating", q } = searchParams;

  let query = supabase
    .from("professional_profiles")
    .select("user_id, name, avatar_url, region, career, specialties, services, rating_avg, review_count")
    .eq("approved", true)
    .limit(50);

  if (q) query = query.ilike("name", `%${q}%`);
  if (cat) query = query.contains("specialties", [cat]);
  query =
    sort === "reviews" ? query.order("review_count", { ascending: false })
    : sort === "recent" ? query.order("created_at", { ascending: false })
    : query.order("rating_avg", { ascending: false });

  const { data } = await query;
  const pros = data ?? [];

  const chip = (href: string, label: string, active: boolean) => (
    <Link key={label} href={href}
      className={clsx("chip whitespace-nowrap border", active ? "bg-ink text-ground border-ink" : "bg-surface text-ink-2 border-border")}>
      {label}
    </Link>
  );
  const qs = (over: Record<string, string>) => {
    const p = new URLSearchParams({ ...(cat ? { cat } : {}), sort, ...(q ? { q } : {}), ...over });
    return `/app/pros?${p.toString()}`;
  };

  return (
    <div className="pb-8">
      <header className="sticky top-0 z-20 bg-ground/95 backdrop-blur px-5 pt-4 pb-3">
        <h1 className="text-xl font-bold mb-3">전문가 찾기</h1>
        <form action="/app/pros" className="relative mb-3">
          {cat && <input type="hidden" name="cat" value={cat} />}
          <input name="q" defaultValue={q} placeholder="이름·활동명 검색" className="field pl-10 py-2.5" />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" width="18" height="18"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" />
          </svg>
        </form>
        <div className="flex gap-2 overflow-x-auto -mx-5 px-5 pb-2">
          {chip(qs({ cat: "" }), "전체", !cat)}
          {CATS.map(([type, label]) => chip(qs({ cat: type }), label, cat === type))}
        </div>
        <div className="flex gap-2 mt-1">
          {SORTS.map((s) => chip(qs({ sort: s.key }), s.label, sort === s.key))}
        </div>
      </header>

      {pros.length === 0 ? (
        <Empty text="조건에 맞는 전문가가 없어요." />
      ) : (
        <ul className="px-5 py-4 flex flex-col gap-3">
          {pros.map((p) => (
            <li key={p.user_id}>
              <Link href={`/app/pros/${p.user_id}`} className="card p-4 flex items-center gap-3">
                <Avatar src={p.avatar_url} name={p.name} size={52} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[15px]">{p.name ?? "전문가"}</div>
                  <div className="text-[12px] text-ink-3 mb-1">{[p.region, p.career].filter(Boolean).join(" · ")}</div>
                  <div className="flex flex-wrap gap-1">
                    {(p.specialties as CategoryType[] | null)?.slice(0, 3).map((s) => (
                      <Badge key={s} tone="accent">{CATEGORY_LABELS[s] ?? s}</Badge>
                    ))}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[13px] font-semibold text-accent-ink">★ {Number(p.rating_avg).toFixed(1)}</div>
                  <div className="text-[11px] text-ink-3">리뷰 {p.review_count}</div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
