import Link from "next/link";
import { listRecruitPosts } from "@/lib/reads";
import { PostCard, type PostWithPro } from "@/components/PostCard";
import { Empty } from "@/components/ui";
import { CATEGORY_LABELS } from "@/lib/constants";
import { clsx } from "@/lib/clsx";

export const dynamic = "force-dynamic";

const CATS = Object.entries(CATEGORY_LABELS); // [type, label]

export default async function PostsPage({
  searchParams,
}: {
  searchParams: { cat?: string; urgent?: string; q?: string };
}) {
  const { cat, urgent, q } = searchParams;

  const posts = (await listRecruitPosts({
    urgentOnly: urgent === "1",
    q,
    categoryType: cat,
    limit: 40,
  })) as unknown as PostWithPro[];

  const chip = (href: string, label: string, active: boolean) => (
    <Link
      key={label}
      href={href}
      className={clsx(
        "chip whitespace-nowrap border",
        active ? "bg-ink text-ground border-ink" : "bg-surface text-ink-2 border-border"
      )}
    >
      {label}
    </Link>
  );

  return (
    <div>
      <header className="sticky top-0 z-20 bg-ground/95 backdrop-blur px-5 pt-4 pb-3">
        <h1 className="text-xl font-bold mb-3">모델 모집 공고</h1>
        <form action="/app/posts" className="relative mb-3">
          <input
            name="q"
            defaultValue={q}
            placeholder="시술·지역 검색"
            className="field pl-10 py-2.5"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" width="18" height="18"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" />
          </svg>
        </form>
        <div className="flex gap-2 overflow-x-auto -mx-5 px-5 pb-1">
          {chip("/app/posts", "전체", !cat && urgent !== "1")}
          {chip("/app/posts?urgent=1", "⚡급구", urgent === "1")}
          {CATS.map(([type, label]) =>
            chip(`/app/posts?cat=${type}`, label, cat === type)
          )}
        </div>
      </header>

      {posts.length === 0 ? (
        <Empty text="조건에 맞는 공고가 없어요." />
      ) : (
        <div className="grid grid-cols-2 gap-3 px-5 py-4">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      )}
    </div>
  );
}
