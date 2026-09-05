import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { listMyApplications } from "@/lib/reads";
import { Badge, Empty, statusTone } from "@/components/ui";
import { APPLICATION_STATUS_LABELS } from "@/lib/constants";
import { timeAgo } from "@/lib/format";
import type { RecruitApplicationRow } from "@/lib/database.types";

export const dynamic = "force-dynamic";

type Row = RecruitApplicationRow & {
  post?: { id: string; title: string; status: string; reference_images: string[] } | null;
};

export default async function MyApplications({
  searchParams,
}: {
  searchParams: { applied?: string };
}) {
  const me = (await getSessionUser())!;
  const apps = (await listMyApplications(me.id)) as unknown as Row[];

  return (
    <div className="pb-8">
      <header className="sticky top-0 z-20 bg-ground/95 backdrop-blur px-4 py-3 flex items-center gap-2">
        <Link href="/app/my" aria-label="뒤로" className="p-1 text-ink-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <span className="font-semibold">지원 내역</span>
      </header>

      {searchParams.applied === "1" && (
        <div className="mx-5 mt-3 card p-3 bg-good-soft border-good/30 text-[13px] text-good">
          ✓ 지원이 완료됐어요. 전문가가 확인하면 알려드릴게요.
        </div>
      )}

      {apps.length === 0 ? (
        <Empty text="아직 지원한 공고가 없어요." />
      ) : (
        <ul className="px-5 py-4 flex flex-col gap-2.5">
          {apps.map((a) => (
            <li key={a.id}>
              <Link href={a.post ? `/app/posts/${a.post.id}` : "#"} className="card p-3.5 flex items-center gap-3">
                <div className="w-14 h-14 rounded-lg bg-surface-2 overflow-hidden shrink-0">
                  {a.post?.reference_images?.[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.post.reference_images[0]} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[14px] truncate">{a.post?.title ?? "삭제된 공고"}</div>
                  <div className="text-[12px] text-ink-3 mt-0.5">{timeAgo(a.created_at)} 지원</div>
                </div>
                <Badge tone={statusTone(a.status)}>{APPLICATION_STATUS_LABELS[a.status]}</Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
