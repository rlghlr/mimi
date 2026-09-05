import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { listRecruitPosts, listProfessionals } from "@/lib/reads";
import { PostCard, type PostWithPro } from "@/components/PostCard";
import { Avatar, Badge, Empty, SectionHeader } from "@/components/ui";
import { BRAND } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function CustomerHome() {
  const me = await getSessionUser();

  const [urgent, recent, pros] = await Promise.all([
    listRecruitPosts({ urgentOnly: true, limit: 6 }),
    listRecruitPosts({ limit: 8 }),
    listProfessionals({ sort: "rating", limit: 6 }),
  ]);

  const urgentList = urgent as unknown as PostWithPro[];
  const recentList = recent as unknown as PostWithPro[];

  return (
    <div>
      {/* top bar */}
      <header className="sticky top-0 z-20 bg-ground/95 backdrop-blur px-5 pt-4 pb-3 flex items-center gap-3">
        <button className="flex items-center gap-1 text-[15px] font-bold">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 21s-7-5.5-7-11a7 7 0 1114 0c0 5.5-7 11-7 11z" />
            <circle cx="12" cy="10" r="2.5" />
          </svg>
          강남
        </button>
        <div className="flex-1" />
        <Link href="/app/posts" aria-label="검색" className="p-1.5 text-ink-2">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" />
          </svg>
        </Link>
        <Link href="/app/notifications" aria-label="알림" className="p-1.5 text-ink-2 relative">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M18 8a6 6 0 10-12 0c0 7-3 8-3 8h18s-3-1-3-8M13.7 21a2 2 0 01-3.4 0" />
          </svg>
        </Link>
      </header>

      {/* hero strip */}
      <section className="px-5 pt-2 pb-5">
        <p className="font-mono text-[11px] tracking-widest uppercase text-accent-ink mb-1">
          {BRAND.tagline}
        </p>
        <h1 className="font-display text-[26px] leading-tight">
          오늘, 어울리는 변화를<br />함께할 사람을 찾아요
        </h1>
      </section>

      {/* 급구 */}
      {urgentList.length > 0 && (
        <section className="mb-7">
          <SectionHeader title="⚡ 급구 모델" action="전체" href="/app/posts?urgent=1" />
          <div className="flex gap-3 overflow-x-auto px-5 pb-1 snap-x">
            {urgentList.map((p) => (
              <div key={p.id} className="w-[220px] shrink-0 snap-start">
                <PostCard post={p} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 추천 전문가 */}
      {pros && pros.length > 0 && (
        <section className="mb-7">
          <SectionHeader title="나에게 맞는 전문가" action="전체" href="/app/pros" />
          <div className="flex gap-4 overflow-x-auto px-5 pb-1">
            {pros.map((pro) => (
              <Link
                key={pro.user_id}
                href={`/app/pros/${pro.user_id}`}
                className="w-[76px] shrink-0 text-center"
              >
                <Avatar src={pro.avatar_url} name={pro.name} size={64} />
                <div className="text-[12px] font-medium mt-1.5 truncate">{pro.name ?? "전문가"}</div>
                <div className="text-[11px] text-ink-3">
                  ★ {Number(pro.rating_avg).toFixed(1)}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 최근 등록 공고 */}
      <section className="mb-6">
        <SectionHeader title="최근 모집 공고" action="전체" href="/app/posts" />
        {recentList.length === 0 ? (
          <Empty text="아직 등록된 공고가 없어요." />
        ) : (
          <div className="grid grid-cols-2 gap-3 px-5">
            {recentList.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        )}
      </section>

      <div className="px-5 pb-8">
        <div className="card p-4 flex items-center gap-3 bg-accent-soft border-accent/20">
          <span className="text-2xl">💬</span>
          <div className="flex-1">
            <div className="font-semibold text-[14px]">원하는 시술이 있나요?</div>
            <div className="text-[12px] text-ink-2">고민을 올리면 전문가가 제안해요.</div>
          </div>
          <Link href="/app/consult/new" className="btn-primary px-3 py-2 text-[13px]">
            상담 등록
          </Link>
        </div>
      </div>
    </div>
  );
}
