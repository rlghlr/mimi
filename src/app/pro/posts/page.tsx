import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { listProOwnPosts } from "@/lib/reads";
import { Badge, Empty, statusTone } from "@/components/ui";
import { POST_STATUS_LABELS } from "@/lib/constants";
import { timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ProPostsPage() {
  const me = (await getSessionUser())!;
  const posts = await listProOwnPosts(me.id);

  return (
    <div className="pb-8">
      <header className="sticky top-0 z-20 bg-ground/95 backdrop-blur px-5 pt-4 pb-3 flex items-center justify-between">
        <h1 className="text-xl font-bold">모집 공고 관리</h1>
        <Link href="/pro/posts/new" className="btn-primary px-3 py-2 text-[13px]">＋ 등록</Link>
      </header>

      {!posts || posts.length === 0 ? (
        <Empty text="등록한 공고가 없어요. 첫 모집을 시작해 보세요." />
      ) : (
        <ul className="px-5 py-3 flex flex-col gap-2.5">
          {posts.map((p) => (
            <li key={p.id}>
              <Link href={`/pro/posts/${p.id}/applicants`} className="card p-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    {p.is_urgent && <Badge tone="crit">급구</Badge>}
                    <Badge tone={statusTone(p.status)}>{POST_STATUS_LABELS[p.status]}</Badge>
                  </div>
                  <div className="font-semibold text-[14px] truncate">{p.title}</div>
                  <div className="text-[12px] text-ink-3 mt-0.5">
                    지원 {p.applicant_count ?? 0} · 매칭 {p.matched_count}/{p.headcount} · {timeAgo(p.created_at)}
                  </div>
                </div>
                <span className="text-ink-3">›</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
