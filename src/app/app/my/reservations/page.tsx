import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { Avatar, Badge, Empty, statusTone } from "@/components/ui";
import { RESERVATION_STATUS_LABELS } from "@/lib/constants";
import { won } from "@/lib/format";
import { RESERVATION_PRO_SELECT } from "@/lib/queries";
import { updateReservationStatusAction } from "@/app/app/reserve/actions";
import type { ReservationRow, ProfessionalProfileRow, ShopRow } from "@/lib/database.types";

export const dynamic = "force-dynamic";

type Row = ReservationRow & {
  pro?: Pick<ProfessionalProfileRow, "name" | "avatar_url"> | null;
  shop?: Pick<ShopRow, "name" | "address"> | null;
  has_review?: boolean;
};

export default async function MyReservations({ searchParams }: { searchParams: { requested?: string } }) {
  const supabase = createClient();
  const me = (await getSessionUser())!;

  const { data } = await supabase
    .from("reservations")
    .select(RESERVATION_PRO_SELECT)
    .eq("customer_id", me.id)
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as unknown as Row[];

  // which completed reservations already have a review
  const completedIds = rows.filter((r) => r.status === "completed").map((r) => r.id);
  const reviewed = new Set<string>();
  if (completedIds.length) {
    const { data: rv } = await supabase.from("reviews").select("reservation_id").in("reservation_id", completedIds);
    (rv ?? []).forEach((r) => r.reservation_id && reviewed.add(r.reservation_id));
  }

  return (
    <div className="pb-8">
      <header className="sticky top-0 z-20 bg-ground/95 backdrop-blur px-4 py-3 flex items-center gap-2">
        <Link href="/app/my" aria-label="뒤로" className="p-1 text-ink-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M15 18l-6-6 6-6" /></svg>
        </Link>
        <span className="font-semibold">예약 내역</span>
      </header>

      {searchParams.requested === "1" && (
        <div className="mx-5 mt-3 card p-3 bg-good-soft border-good/30 text-[13px] text-good">
          ✓ 예약을 요청했어요. 전문가가 확인하면 알려드릴게요.
        </div>
      )}

      {rows.length === 0 ? (
        <Empty icon="📅" text="예약 내역이 없어요." />
      ) : (
        <ul className="px-5 py-4 flex flex-col gap-3">
          {rows.map((r) => (
            <li key={r.id} className="card p-4">
              <div className="flex items-center gap-3">
                <Avatar src={r.pro?.avatar_url} name={r.pro?.name} size={40} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[14px]">{r.pro?.name ?? "전문가"}</div>
                  <div className="text-[12px] text-ink-3">{r.service ?? "시술"}</div>
                </div>
                <Badge tone={statusTone(r.status)}>{RESERVATION_STATUS_LABELS[r.status]}</Badge>
              </div>
              <div className="text-[13px] text-ink-2 mt-2.5 flex flex-wrap gap-x-3 gap-y-1">
                {r.session_date && <span>📅 {r.session_date} {r.session_time}</span>}
                {r.shop?.name && <span>📍 {r.shop.name}</span>}
                <span>💳 {r.final_amount === 0 ? "무료" : won(r.final_amount)}</span>
              </div>

              <div className="flex gap-2 mt-3">
                {r.status === "requested" && (
                  <form action={updateReservationStatusAction} className="flex-1">
                    <input type="hidden" name="reservation_id" value={r.id} />
                    <input type="hidden" name="status" value="cancelled" />
                    <button className="btn-ghost w-full py-2 text-[13px]">예약 취소</button>
                  </form>
                )}
                {r.status === "completed" && !reviewed.has(r.id) && (
                  <Link href={`/app/reviews/new?reservation=${r.id}`} className="btn-primary flex-1 py-2 text-[13px] text-center">
                    리뷰 작성
                  </Link>
                )}
                {r.status === "completed" && reviewed.has(r.id) && (
                  <span className="text-[12px] text-ink-3 py-2">✓ 리뷰 작성 완료</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
