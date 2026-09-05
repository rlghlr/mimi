import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { listMyConsultations } from "@/lib/reads";
import { Badge, Empty, statusTone } from "@/components/ui";
import { CATEGORY_LABELS } from "@/lib/constants";
import { timeAgo } from "@/lib/format";
import type { ConsultationRow, CategoryRow } from "@/lib/database.types";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  open: "제안 받는 중", offered: "제안 도착", closed: "종료", cancelled: "취소",
};

type Row = ConsultationRow & {
  category?: Pick<CategoryRow, "name" | "type"> | null;
  offer_count?: number;
};

export default async function ConsultList({ searchParams }: { searchParams: { created?: string } }) {
  const me = (await getSessionUser())!;
  const items = (await listMyConsultations(me.id)) as unknown as Row[];

  return (
    <div className="pb-8">
      <header className="sticky top-0 z-20 bg-ground/95 backdrop-blur px-5 pt-4 pb-3 flex items-center justify-between">
        <h1 className="text-xl font-bold">내 상담</h1>
        <Link href="/app/consult/new" className="btn-primary px-3 py-2 text-[13px]">＋ 상담</Link>
      </header>

      {searchParams.created === "1" && (
        <div className="mx-5 mt-3 card p-3 bg-good-soft border-good/30 text-[13px] text-good">
          ✓ 상담이 등록됐어요. 전문가의 제안을 기다려 주세요.
        </div>
      )}

      {items.length === 0 ? (
        <Empty icon="💬" text="등록한 상담이 없어요. 고민을 올리면 전문가가 제안해요." />
      ) : (
        <ul className="px-5 py-4 flex flex-col gap-3">
          {items.map((c) => {
            const cat = c.category?.name ?? (c.category?.type && CATEGORY_LABELS[c.category.type]);
            const n = c.offer_count ?? 0;
            return (
              <li key={c.id}>
                <Link href={`/app/consult/${c.id}`} className="card p-4 block">
                  <div className="flex items-center gap-2 mb-1.5">
                    {cat && <Badge tone="accent">{cat}</Badge>}
                    <Badge tone={n > 0 ? "good" : statusTone(c.status)}>
                      {n > 0 ? `제안 ${n}` : STATUS_LABEL[c.status]}
                    </Badge>
                    <span className="text-[11px] text-ink-3 ml-auto">{timeAgo(c.created_at)}</span>
                  </div>
                  <p className="text-[14px] line-clamp-2">{c.content}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
