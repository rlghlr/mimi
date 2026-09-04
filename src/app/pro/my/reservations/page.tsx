import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { Avatar, Badge, Empty, statusTone } from "@/components/ui";
import { RESERVATION_STATUS_LABELS } from "@/lib/constants";
import { won } from "@/lib/format";
import { RESERVATION_CUST_SELECT } from "@/lib/queries";
import { updateReservationStatusAction } from "@/app/app/reserve/actions";
import type { ReservationRow, CustomerProfileRow, ShopRow } from "@/lib/database.types";

export const dynamic = "force-dynamic";

type Row = ReservationRow & {
  customer?: Pick<CustomerProfileRow, "nickname" | "avatar_url"> | null;
  shop?: Pick<ShopRow, "name" | "address"> | null;
};

// which status transitions the pro can trigger from each state
const NEXT: Record<string, { status: string; label: string; primary?: boolean }[]> = {
  requested: [{ status: "confirmed", label: "예약 확정", primary: true }, { status: "cancelled", label: "거절" }],
  confirmed: [{ status: "upcoming", label: "방문 예정", primary: true }, { status: "cancelled", label: "취소" }],
  upcoming: [{ status: "completed", label: "시술 완료", primary: true }, { status: "no_show", label: "노쇼" }],
};

export default async function ProReservations() {
  const supabase = createClient();
  const me = (await getSessionUser())!;

  const { data } = await supabase
    .from("reservations")
    .select(RESERVATION_CUST_SELECT)
    .eq("pro_id", me.id)
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as unknown as Row[];

  return (
    <div className="pb-8">
      <header className="sticky top-0 z-20 bg-ground/95 backdrop-blur px-4 py-3 flex items-center gap-2">
        <Link href="/pro/my" aria-label="뒤로" className="p-1 text-ink-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M15 18l-6-6 6-6" /></svg>
        </Link>
        <span className="font-semibold">예약 관리</span>
      </header>

      {rows.length === 0 ? (
        <Empty icon="📅" text="예약 요청이 없어요." />
      ) : (
        <ul className="px-5 py-4 flex flex-col gap-3">
          {rows.map((r) => {
            const actions = NEXT[r.status] ?? [];
            return (
              <li key={r.id} className="card p-4">
                <div className="flex items-center gap-3">
                  <Avatar src={r.customer?.avatar_url} name={r.customer?.nickname} size={40} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[14px]">{r.customer?.nickname ?? "회원"}</div>
                    <div className="text-[12px] text-ink-3">{r.service ?? "시술"}</div>
                  </div>
                  <Badge tone={statusTone(r.status)}>{RESERVATION_STATUS_LABELS[r.status]}</Badge>
                </div>
                <div className="text-[13px] text-ink-2 mt-2.5 flex flex-wrap gap-x-3 gap-y-1">
                  {r.session_date && <span>📅 {r.session_date} {r.session_time}</span>}
                  <span>💳 {r.final_amount === 0 ? "무료" : won(r.final_amount)}</span>
                </div>

                {actions.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {actions.map((a) => (
                      <form key={a.status} action={updateReservationStatusAction} className={a.primary ? "flex-1" : ""}>
                        <input type="hidden" name="reservation_id" value={r.id} />
                        <input type="hidden" name="status" value={a.status} />
                        <button className={`${a.primary ? "btn-primary w-full" : "btn-ghost"} py-2 text-[13px] px-4`}>
                          {a.label}
                        </button>
                      </form>
                    ))}
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
