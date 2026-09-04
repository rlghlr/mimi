import Link from "next/link";
import { Avatar, Badge, statusTone } from "@/components/ui";
import { CATEGORY_LABELS, POST_STATUS_LABELS } from "@/lib/constants";
import { costSummary, daysUntil } from "@/lib/format";
import type { RecruitPostRow, ProfessionalProfileRow, CategoryRow } from "@/lib/database.types";

export type PostWithPro = RecruitPostRow & {
  pro?: Pick<ProfessionalProfileRow, "name" | "avatar_url" | "career" | "region"> | null;
  category?: Pick<CategoryRow, "name" | "type"> | null;
  applicant_count?: number;
};

/** Image-first marketplace card (list + home). */
export function PostCard({ post, compact }: { post: PostWithPro; compact?: boolean }) {
  const cover = post.reference_images?.[0] || post.result_images?.[0];
  const left = daysUntil(post.session_date);
  const catName = post.category?.name ?? (post.category?.type && CATEGORY_LABELS[post.category.type]);

  return (
    <Link href={`/app/posts/${post.id}`} className="card overflow-hidden block active:scale-[0.99] transition-transform">
      <div className="relative aspect-[4/3] bg-surface-2">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt={post.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full grid place-items-center text-ink-3 text-sm">이미지 없음</div>
        )}
        <div className="absolute top-2.5 left-2.5 flex gap-1.5">
          {post.is_urgent && <Badge tone="crit">급구</Badge>}
          {catName && <Badge tone="accent">{catName}</Badge>}
        </div>
        {post.status !== "recruiting" && (
          <div className="absolute inset-0 bg-ink/40 grid place-items-center">
            <Badge tone={statusTone(post.status)}>{POST_STATUS_LABELS[post.status]}</Badge>
          </div>
        )}
      </div>

      <div className="p-3.5">
        <h3 className="font-semibold text-[15px] leading-snug line-clamp-1">{post.title}</h3>
        <div className="flex items-center gap-2 mt-2">
          <Avatar src={post.pro?.avatar_url} name={post.pro?.name} size={22} />
          <span className="text-[12.5px] text-ink-2 truncate">{post.pro?.name ?? "전문가"}</span>
          {post.region && <span className="text-[12px] text-ink-3">· {post.region}</span>}
        </div>

        {!compact && (
          <div className="flex items-center justify-between mt-3">
            <span className="text-[13px] font-semibold text-accent-ink">{costSummary(post)}</span>
            <div className="flex items-center gap-2 text-[11.5px] text-ink-3">
              {typeof post.applicant_count === "number" && <span>지원 {post.applicant_count}</span>}
              {left !== null && left >= 0 && <span>· {left === 0 ? "오늘" : `D-${left}`}</span>}
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
