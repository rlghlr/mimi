import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getProfessional, listPortfolio, listProReviews, listProRecruitingPosts, getFavorite } from "@/lib/reads";
import { Avatar, Badge, Empty } from "@/components/ui";
import { FavoriteButton } from "@/components/FavoriteButton";
import { CATEGORY_LABELS } from "@/lib/constants";
import { costSummary, timeAgo } from "@/lib/format";
import { clsx } from "@/lib/clsx";
import { PreparingButton } from "@/components/PreparingButton";
import type { CategoryType } from "@/lib/database.types";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "portfolio", label: "포트폴리오" },
  { key: "reviews", label: "리뷰" },
  { key: "posts", label: "모집공고" },
  { key: "products", label: "상품" },
] as const;

export default async function ProDetail({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { tab?: string };
}) {
  const me = await getSessionUser();
  const tab = (searchParams.tab ?? "portfolio") as (typeof TABS)[number]["key"];

  const p = await getProfessional(params.id);
  if (!p) notFound();

  const [portfolio, reviews, posts, favorited] = await Promise.all([
    listPortfolio(params.id),
    listProReviews(params.id),
    listProRecruitingPosts(params.id),
    me ? getFavorite(me.id, "professional", params.id) : Promise.resolve(false),
  ]);

  const tabHref = (t: string) => `/app/pros/${params.id}?tab=${t}`;

  return (
    <div className="pb-24">
      <header className="sticky top-0 z-20 bg-ground/90 backdrop-blur px-4 py-3 flex items-center gap-2">
        <Link href="/app/pros" aria-label="뒤로" className="p-1 text-ink-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M15 18l-6-6 6-6" /></svg>
        </Link>
        <span className="font-semibold truncate flex-1">{p.name}</span>
        {me && <FavoriteButton targetType="professional" targetId={params.id} initial={favorited} />}
      </header>

      <section className="px-5 pt-3">
        <div className="flex items-center gap-4">
          <Avatar src={p.avatar_url} name={p.name} size={68} />
          <div className="flex-1">
            <div className="font-bold text-[19px]">{p.name}</div>
            <div className="text-[12.5px] text-ink-3">{[p.region, p.career].filter(Boolean).join(" · ")}</div>
            <div className="text-[13px] text-accent-ink font-semibold mt-0.5">
              ★ {Number(p.rating_avg).toFixed(1)} · 리뷰 {p.review_count}
            </div>
          </div>
        </div>
        {p.bio && <p className="text-[14px] text-ink-2 mt-3 leading-relaxed">{p.bio}</p>}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {(p.specialties as CategoryType[] | null)?.map((s) => (
            <Badge key={s} tone="accent">{CATEGORY_LABELS[s] ?? s}</Badge>
          ))}
        </div>
      </section>

      {/* tabs */}
      <div className="flex gap-5 px-5 mt-5 border-b border-border sticky top-[52px] bg-ground/95 backdrop-blur z-10">
        {TABS.map((t) => (
          <Link key={t.key} href={tabHref(t.key)}
            className={clsx("pb-2.5 text-[14px]", tab === t.key ? "border-b-2 border-accent font-semibold text-ink" : "text-ink-3")}>
            {t.label}
          </Link>
        ))}
      </div>

      <div className="px-5 py-4">
        {tab === "portfolio" && (
          !portfolio || portfolio.length === 0 ? <Empty text="등록된 포트폴리오가 없어요." /> : (
            <div className="grid grid-cols-3 gap-1">
              {portfolio.map((pf) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={pf.id} src={pf.image_url} alt={pf.caption ?? ""} className="aspect-square object-cover bg-surface-2 rounded-sm" />
              ))}
            </div>
          )
        )}

        {tab === "reviews" && (
          !reviews || reviews.length === 0 ? <Empty icon="★" text="아직 리뷰가 없어요." /> : (
            <ul className="flex flex-col gap-3">
              {reviews.map((r) => (
                <li key={r.id} className="card p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-accent text-[14px]">{"★".repeat(r.rating)}<span className="text-border-2">{"★".repeat(5 - r.rating)}</span></span>
                    <span className="text-[11px] text-ink-3">{timeAgo(r.created_at)}</span>
                  </div>
                  {r.service_name && <div className="text-[12px] text-ink-3 mb-1">{r.service_name}</div>}
                  {r.text && <p className="text-[14px]">{r.text}</p>}
                  {r.photos?.length ? (
                    <div className="flex gap-2 mt-2">
                      {r.photos.slice(0, 3).map((ph: string) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={ph} src={ph} alt="" className="w-16 h-16 rounded-lg object-cover" />
                      ))}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )
        )}

        {tab === "posts" && (
          !posts || posts.length === 0 ? <Empty text="진행 중인 모집이 없어요." /> : (
            <ul className="flex flex-col gap-2.5">
              {posts.map((po) => (
                <li key={po.id}>
                  <Link href={`/app/posts/${po.id}`} className="card p-3.5 flex items-center gap-3">
                    <div className="w-14 h-14 rounded-lg bg-surface-2 overflow-hidden shrink-0">
                      {po.reference_images?.[0] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={po.reference_images[0]} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      {po.is_urgent && <Badge tone="crit">급구</Badge>}
                      <div className="font-semibold text-[14px] truncate mt-0.5">{po.title}</div>
                      <div className="text-[12px] text-accent-ink">{costSummary(po)}</div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )
        )}

        {tab === "products" && (
          <Empty icon="🎫" text="리뷰 특가·상품은 준비 중이에요. (MVP 3차)" />
        )}
      </div>

      {/* sticky CTA */}
      {me && (
        <div className="fixed bottom-0 inset-x-0 z-30">
          <div className="max-w-app mx-auto bg-surface/95 backdrop-blur border-t border-border px-5 py-3 flex gap-2">
            <PreparingButton className="btn-outline flex-1">상담하기</PreparingButton>
            <Link href={`/app/reserve/new?pro=${params.id}`} className="btn-primary flex-1">예약하기</Link>
          </div>
        </div>
      )}
    </div>
  );
}
