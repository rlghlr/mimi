import { getSessionUser } from "@/lib/auth";
import { listOpenConsultations } from "@/lib/reads";
import { Avatar, Badge, Empty } from "@/components/ui";
import { CATEGORY_LABELS } from "@/lib/constants";
import { timeAgo, won } from "@/lib/format";
import { OfferComposer } from "./OfferComposer";
import type { ConsultationRow, CustomerProfileRow, CategoryRow } from "@/lib/database.types";

export const dynamic = "force-dynamic";

type Row = ConsultationRow & {
  customer?: Pick<CustomerProfileRow, "nickname" | "avatar_url" | "region"> | null;
  category?: Pick<CategoryRow, "name" | "type"> | null;
  _offered?: boolean;
};

export default async function ProModels({ searchParams }: { searchParams: { sent?: string } }) {
  const me = (await getSessionUser())!;
  const items = (await listOpenConsultations(me.id)) as unknown as Row[];

  return (
    <div className="pb-8">
      <header className="sticky top-0 z-20 bg-ground/95 backdrop-blur px-5 pt-4 pb-3">
        <h1 className="text-xl font-bold">고객 상담 · 모델 찾기</h1>
        <p className="text-[12px] text-ink-3 mt-0.5">고객의 고민을 확인하고 제안을 보내보세요.</p>
      </header>

      {searchParams.sent === "1" && (
        <div className="mx-5 mt-3 card p-3 bg-good-soft border-good/30 text-[13px] text-good">
          ✓ 제안을 보냈어요. 고객이 확인하면 채팅으로 이어져요.
        </div>
      )}

      {items.length === 0 ? (
        <Empty icon="💬" text="현재 등록된 상담글이 없어요." />
      ) : (
        <ul className="px-5 py-4 flex flex-col gap-3">
          {items.map((c) => {
            const cat = c.category?.name ?? (c.category?.type && CATEGORY_LABELS[c.category.type]);
            return (
              <li key={c.id} className="card p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Avatar src={c.customer?.avatar_url} name={c.customer?.nickname} size={36} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[14px]">{c.customer?.nickname ?? "회원"}</div>
                    <div className="text-[11px] text-ink-3">
                      {[cat, c.region, c.budget ? won(c.budget) : null].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  <span className="text-[11px] text-ink-3">{timeAgo(c.created_at)}</span>
                </div>
                <p className="text-[14px] text-ink-2 line-clamp-3">{c.content}</p>

                {c._offered ? (
                  <div className="mt-3"><Badge tone="good">제안 완료</Badge></div>
                ) : (
                  <OfferComposer consultationId={c.id} />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
