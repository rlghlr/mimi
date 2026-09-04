import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { Badge, Empty, statusTone } from "@/components/ui";
import { POST_STATUS_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function ProHome() {
  const supabase = createClient();
  const me = (await getSessionUser())!;

  const { data: profile } = await supabase
    .from("professional_profiles")
    .select("name, approved, rating_avg, review_count")
    .eq("user_id", me.id)
    .single();

  const { data: posts } = await supabase
    .from("recruit_posts")
    .select("id, title, status, headcount, matched_count, is_urgent, created_at")
    .eq("pro_id", me.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(20);

  const postIds = (posts ?? []).map((p) => p.id);
  const { count: applicantCount } = postIds.length
    ? await supabase
        .from("recruit_applications")
        .select("id", { count: "exact", head: true })
        .in("post_id", postIds)
        .eq("status", "applied")
    : { count: 0 };

  const activeCount = (posts ?? []).filter((p) => p.status === "recruiting").length;

  return (
    <div>
      <header className="px-5 pt-5 pb-3">
        <p className="font-mono text-[11px] tracking-widest uppercase text-accent-ink">Studio</p>
        <h1 className="font-display text-[26px] leading-tight">
          {profile?.name ?? "전문가"}님의 스튜디오
        </h1>
      </header>

      {!profile?.approved && (
        <div className="mx-5 mb-4 card p-4 bg-warn-soft border-warn/30">
          <div className="flex items-center gap-2 mb-1">
            <Badge tone="warn">승인 대기중</Badge>
          </div>
          <p className="text-[13px] text-ink-2">
            운영자 승인 후 모집 공고를 등록할 수 있어요. 프로필·포트폴리오·자격 정보를 채워두시면
            승인이 빨라져요.
          </p>
          <Link href="/pro/my/profile" className="text-accent font-semibold text-[13px] mt-2 inline-block">
            프로필 완성하기 →
          </Link>
        </div>
      )}

      {/* stat row */}
      <div className="grid grid-cols-3 gap-3 px-5 mb-6">
        {[
          ["모집중", activeCount, "/pro/posts"],
          ["신규 지원", applicantCount ?? 0, "/pro/posts"],
          ["평점", profile?.rating_avg ? Number(profile.rating_avg).toFixed(1) : "–", "/pro/my/reviews"],
        ].map(([label, val, href]) => (
          <Link key={label as string} href={href as string} className="card p-3.5 text-center">
            <div className="font-display text-[26px] text-accent leading-none">{val}</div>
            <div className="text-[11px] text-ink-3 mt-1.5">{label}</div>
          </Link>
        ))}
      </div>

      {/* quick actions */}
      <div className="grid grid-cols-2 gap-3 px-5 mb-7">
        <Link href="/pro/posts/new" className="btn-primary">＋ 모델 모집</Link>
        <Link href="/pro/models" className="btn-outline">상담글 보기</Link>
      </div>

      {/* my posts */}
      <section>
        <div className="flex items-baseline justify-between px-5 mb-3">
          <h2 className="text-[17px] font-bold">내 모집 공고</h2>
          <Link href="/pro/posts" className="text-[13px] text-ink-3">전체</Link>
        </div>
        {!posts || posts.length === 0 ? (
          <Empty text="아직 등록한 공고가 없어요." />
        ) : (
          <ul className="px-5 flex flex-col gap-2.5">
            {posts.slice(0, 6).map((p) => (
              <li key={p.id}>
                <Link href={`/pro/posts/${p.id}/applicants`} className="card p-3.5 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      {p.is_urgent && <Badge tone="crit">급구</Badge>}
                      <Badge tone={statusTone(p.status)}>{POST_STATUS_LABELS[p.status]}</Badge>
                    </div>
                    <div className="font-semibold text-[14px] truncate">{p.title}</div>
                    <div className="text-[12px] text-ink-3 mt-0.5">
                      매칭 {p.matched_count}/{p.headcount}명
                    </div>
                  </div>
                  <span className="text-ink-3">›</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
