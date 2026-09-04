import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { Avatar, Badge, Empty, statusTone } from "@/components/ui";
import { APPLICATION_SELECT } from "@/lib/queries";
import { APPLICATION_STATUS_LABELS, POST_STATUS_LABELS } from "@/lib/constants";
import { timeAgo } from "@/lib/format";
import { startChatAction, rejectApplicantAction, confirmMatchAction } from "./actions";
import { updatePostStatusAction } from "../../actions";
import type { RecruitApplicationRow, CustomerProfileRow } from "@/lib/database.types";

export const dynamic = "force-dynamic";

type AppRow = RecruitApplicationRow & {
  applicant?: Pick<CustomerProfileRow, "nickname" | "avatar_url" | "gender" | "birth_era" | "region" | "hair_length" | "hair_state"> | null;
};

export default async function ApplicantsPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { err?: string };
}) {
  const supabase = createClient();
  const me = (await getSessionUser())!;

  const { data: post } = await supabase
    .from("recruit_posts")
    .select("id, pro_id, title, status, headcount, matched_count")
    .eq("id", params.id)
    .single();
  if (!post || post.pro_id !== me.id) notFound();

  const { data } = await supabase
    .from("recruit_applications")
    .select(APPLICATION_SELECT)
    .eq("post_id", params.id)
    .order("created_at", { ascending: false });
  const apps = (data ?? []) as unknown as AppRow[];

  const full = post.matched_count >= post.headcount;

  return (
    <div className="pb-8">
      <header className="sticky top-0 z-20 bg-ground/90 backdrop-blur px-4 py-3 flex items-center gap-2">
        <Link href="/pro/posts" aria-label="뒤로" className="p-1 text-ink-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <span className="font-semibold truncate flex-1">{post.title}</span>
        <Badge tone={statusTone(post.status)}>{POST_STATUS_LABELS[post.status]}</Badge>
      </header>

      <div className="px-5 py-3 flex items-center justify-between">
        <p className="text-[13px] text-ink-2">
          지원자 <b>{apps.length}</b>명 · 매칭 {post.matched_count}/{post.headcount}
        </p>
        {post.status === "recruiting" && (
          <form action={updatePostStatusAction.bind(null, post.id, "ended")}>
            <button className="text-[12px] text-ink-3 underline">모집 종료</button>
          </form>
        )}
      </div>

      {searchParams.err && (
        <p className="mx-5 mb-2 text-crit text-[13px]" role="alert">{searchParams.err}</p>
      )}

      {apps.length === 0 ? (
        <Empty text="아직 지원자가 없어요." />
      ) : (
        <ul className="px-5 flex flex-col gap-3">
          {apps.map((a) => {
            const p = a.applicant;
            const photos = (a.photos ?? {}) as Record<string, string>;
            const done = a.status === "matched" || a.status === "rejected";
            return (
              <li key={a.id} className="card p-4">
                <div className="flex items-center gap-3">
                  <Avatar src={p?.avatar_url} name={p?.nickname} size={44} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[15px]">{p?.nickname ?? "지원자"}</span>
                      <Badge tone={statusTone(a.status)}>{APPLICATION_STATUS_LABELS[a.status]}</Badge>
                    </div>
                    <div className="text-[12px] text-ink-3">
                      {[p?.gender, p?.birth_era, p?.region].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  <span className="text-[11px] text-ink-3">{timeAgo(a.created_at)}</span>
                </div>

                {(p?.hair_length || p?.hair_state || a.current_state) && (
                  <p className="text-[13px] text-ink-2 mt-2">
                    {[p?.hair_length, p?.hair_state, a.current_state].filter(Boolean).join(" · ")}
                  </p>
                )}
                {a.message && <p className="text-[13px] mt-2 bg-surface-2 rounded-lg px-3 py-2">{a.message}</p>}

                {Object.values(photos).some(Boolean) && (
                  <div className="flex gap-2 mt-3">
                    {(["front", "side", "back"] as const).map((k) =>
                      photos[k] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={k} src={photos[k]} alt={k}
                          className="w-16 h-16 rounded-lg object-cover bg-surface-2" />
                      ) : null
                    )}
                  </div>
                )}

                {!done && (
                  <div className="flex gap-2 mt-3.5">
                    <form action={startChatAction} className="flex-1">
                      <input type="hidden" name="application_id" value={a.id} />
                      <input type="hidden" name="applicant_id" value={a.applicant_id} />
                      <input type="hidden" name="post_id" value={post.id} />
                      <button className="btn-outline w-full py-2.5 text-[14px]">채팅하기</button>
                    </form>
                    {!full && (
                      <form action={confirmMatchAction} className="flex-1">
                        <input type="hidden" name="applicant_id" value={a.applicant_id} />
                        <input type="hidden" name="post_id" value={post.id} />
                        <button className="btn-primary w-full py-2.5 text-[14px]">매칭확정</button>
                      </form>
                    )}
                    <form action={rejectApplicantAction}>
                      <input type="hidden" name="application_id" value={a.id} />
                      <input type="hidden" name="applicant_id" value={a.applicant_id} />
                      <input type="hidden" name="post_id" value={post.id} />
                      <button className="btn-ghost px-3 py-2.5 text-[14px]" aria-label="거절">✕</button>
                    </form>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
