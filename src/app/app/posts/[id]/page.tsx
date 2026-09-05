import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getRecruitPost, countApplicants, getMyApplication } from "@/lib/reads";
import { Avatar, Badge, statusTone } from "@/components/ui";
import { CATEGORY_LABELS, POST_STATUS_LABELS } from "@/lib/constants";
import { costSummary } from "@/lib/format";
import type { PostWithPro } from "@/components/PostCard";

export const dynamic = "force-dynamic";

function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex gap-3 py-2.5 border-b border-border last:border-0">
      <span className="w-24 shrink-0 text-[13px] text-ink-3">{label}</span>
      <span className="text-[14px] flex-1">{value}</span>
    </div>
  );
}

export default async function PostDetail({ params }: { params: { id: string } }) {
  const me = await getSessionUser();

  const post = (await getRecruitPost(params.id)) as PostWithPro | null;
  if (!post) notFound();

  // applicant count + already-applied check
  const [count, mine] = await Promise.all([
    countApplicants(post.id),
    me ? getMyApplication(post.id, me.id) : Promise.resolve(null),
  ]);

  const cover = post.reference_images?.[0] || post.result_images?.[0];
  const cond = (post.model_conditions ?? {}) as Record<string, string>;
  const agree = (post.agreements ?? {}) as Record<string, boolean>;
  const catName = post.category?.name ?? (post.category?.type && CATEGORY_LABELS[post.category.type]);
  const open = post.status === "recruiting" || post.status === "closing_soon";
  const alreadyApplied = !!mine;

  return (
    <div className="pb-28">
      <header className="sticky top-0 z-20 bg-ground/90 backdrop-blur px-4 py-3 flex items-center gap-2">
        <Link href="/app/posts" aria-label="뒤로" className="p-1 text-ink-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <span className="font-semibold truncate">{catName} 모집</span>
      </header>

      {cover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cover} alt={post.title} className="w-full aspect-[4/3] object-cover bg-surface-2" />
      )}

      <div className="px-5 pt-4">
        <div className="flex items-center gap-2 mb-2">
          {post.is_urgent && <Badge tone="crit">급구</Badge>}
          <Badge tone={statusTone(post.status)}>{POST_STATUS_LABELS[post.status]}</Badge>
          {catName && <Badge tone="accent">{catName}</Badge>}
        </div>
        <h1 className="text-[22px] font-bold leading-snug mb-3">{post.title}</h1>

        <Link href={`/app/pros/${post.pro_id}`} className="flex items-center gap-3 py-3 border-y border-border">
          <Avatar src={post.pro?.avatar_url} name={post.pro?.name} size={44} />
          <div className="flex-1">
            <div className="font-semibold text-[15px]">{post.pro?.name ?? "전문가"}</div>
            <div className="text-[12px] text-ink-3">{post.pro?.career ?? post.region}</div>
          </div>
          <span className="text-ink-3">›</span>
        </Link>

        {post.detail && <p className="text-[14px] leading-relaxed text-ink-2 whitespace-pre-wrap my-4">{post.detail}</p>}

        <section className="card p-4 my-4">
          <h2 className="font-bold text-[15px] mb-1">모집 조건</h2>
          <Row label="시술 비용" value={<b className="text-accent-ink">{costSummary(post)}</b>} />
          <Row label="Before 조건" value={post.before_condition} />
          <Row label="성별" value={cond.gender} />
          <Row label="연령" value={cond.age} />
          <Row label="헤어 길이" value={cond.hair_length} />
          <Row label="시술 이력" value={cond.history} />
          <Row label="모집 인원" value={`${post.matched_count}/${post.headcount}명`} />
        </section>

        <section className="card p-4 my-4">
          <h2 className="font-bold text-[15px] mb-1">일정 · 장소</h2>
          <Row label="날짜" value={post.session_date} />
          <Row label="시간" value={post.session_time} />
          <Row label="소요 시간" value={post.duration_min ? `약 ${post.duration_min}분` : undefined} />
          <Row label="장소" value={post.place} />
          <Row label="주소" value={post.address} />
        </section>

        {Object.values(agree).some(Boolean) && (
          <section className="card p-4 my-4">
            <h2 className="font-bold text-[15px] mb-2">추가 동의 조건</h2>
            <div className="flex flex-wrap gap-2">
              {agree.sns && <Badge tone="neutral">SNS 업로드</Badge>}
              {agree.photo && <Badge tone="neutral">사진 촬영</Badge>}
              {agree.video && <Badge tone="neutral">영상 촬영</Badge>}
              {agree.before_after && <Badge tone="neutral">Before/After 사용</Badge>}
            </div>
          </section>
        )}

        <p className="text-[12px] text-ink-3 text-center my-3">현재 지원자 {count ?? 0}명</p>
      </div>

      {/* sticky CTA */}
      <div className="fixed bottom-0 inset-x-0 z-30">
        <div className="max-w-app mx-auto bg-surface/95 backdrop-blur border-t border-border px-5 py-3">
          {!me ? (
            <Link href="/login" className="btn-primary w-full">로그인하고 지원하기</Link>
          ) : alreadyApplied ? (
            <button className="btn-ghost w-full" disabled>이미 지원한 공고예요</button>
          ) : !open ? (
            <button className="btn-ghost w-full" disabled>모집이 마감됐어요</button>
          ) : post.matched_count >= post.headcount ? (
            <button className="btn-ghost w-full" disabled>모집 인원이 모두 찼어요</button>
          ) : (
            <Link href={`/app/posts/${post.id}/apply`} className="btn-primary w-full">지원하기</Link>
          )}
        </div>
      </div>
    </div>
  );
}
