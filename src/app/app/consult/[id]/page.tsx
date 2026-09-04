import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { Avatar, Badge, Empty } from "@/components/ui";
import { CATEGORY_LABELS } from "@/lib/constants";
import { won } from "@/lib/format";
import { CONSULTATION_SELECT, OFFER_SELECT } from "@/lib/queries";
import { startChatFromOfferAction } from "./actions";
import type { ConsultationRow, ConsultationOfferRow, ProfessionalProfileRow, CategoryRow } from "@/lib/database.types";

export const dynamic = "force-dynamic";

type Consult = ConsultationRow & { category?: Pick<CategoryRow, "name" | "type"> | null };
type Offer = ConsultationOfferRow & {
  pro?: Pick<ProfessionalProfileRow, "name" | "avatar_url" | "career" | "region" | "rating_avg" | "review_count"> | null;
};

export default async function ConsultDetail({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const me = (await getSessionUser())!;

  const { data: c } = await supabase.from("consultations").select(CONSULTATION_SELECT).eq("id", params.id).single();
  if (!c) notFound();
  const consult = c as unknown as Consult;

  const { data: offersData } = await supabase
    .from("consultation_offers")
    .select(OFFER_SELECT)
    .eq("consultation_id", params.id)
    .order("created_at", { ascending: false });
  const offers = (offersData ?? []) as unknown as Offer[];
  const cat = consult.category?.name ?? (consult.category?.type && CATEGORY_LABELS[consult.category.type]);

  return (
    <div className="pb-8">
      <header className="sticky top-0 z-20 bg-ground/90 backdrop-blur px-4 py-3 flex items-center gap-2">
        <Link href="/app/consult" aria-label="뒤로" className="p-1 text-ink-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <span className="font-semibold">상담 상세</span>
      </header>

      <section className="px-5 py-4">
        <div className="flex items-center gap-2 mb-2">
          {cat && <Badge tone="accent">{cat}</Badge>}
          {consult.region && <span className="text-[12px] text-ink-3">{consult.region}</span>}
          {consult.budget ? <span className="text-[12px] text-ink-3">· 예산 {won(consult.budget)}</span> : null}
        </div>
        <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{consult.content}</p>
        {(consult.current_photo || consult.desired_photo) && (
          <div className="grid grid-cols-2 gap-2 mt-3">
            {consult.current_photo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={consult.current_photo} alt="현재" className="rounded-xl aspect-square object-cover bg-surface-2" />
            )}
            {consult.desired_photo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={consult.desired_photo} alt="원하는 스타일" className="rounded-xl aspect-square object-cover bg-surface-2" />
            )}
          </div>
        )}
      </section>

      <div className="h-2 bg-surface-2" />

      <section className="px-5 py-4">
        <h2 className="font-bold text-[16px] mb-3">받은 제안 {offers.length}</h2>
        {offers.length === 0 ? (
          <Empty text="아직 도착한 제안이 없어요. 전문가의 제안을 기다려 주세요." />
        ) : (
          <ul className="flex flex-col gap-3">
            {offers.map((o) => (
              <li key={o.id} className="card p-4">
                <div className="flex items-center gap-3 mb-2.5">
                  <Avatar src={o.pro?.avatar_url} name={o.pro?.name} size={40} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[14px]">{o.pro?.name ?? "전문가"}</div>
                    <div className="text-[11px] text-ink-3">
                      ★ {o.pro?.rating_avg ? Number(o.pro.rating_avg).toFixed(1) : "–"} · {o.pro?.career ?? o.pro?.region}
                    </div>
                  </div>
                  {o.price != null && <Badge tone="accent">{won(o.price)}</Badge>}
                </div>
                {o.recommend && <p className="text-[13px]"><b className="text-ink-2">추천</b> · {o.recommend}</p>}
                {o.method && <p className="text-[13px] text-ink-2 mt-1">{o.method}</p>}
                <div className="flex gap-3 text-[12px] text-ink-3 mt-2">
                  {o.duration_min ? <span>⏱ 약 {o.duration_min}분</span> : null}
                  {o.available_dates?.length ? <span>📅 {o.available_dates.join(", ")}</span> : null}
                </div>
                {o.message && <p className="text-[13px] mt-2 bg-surface-2 rounded-lg px-3 py-2">{o.message}</p>}

                <form action={startChatFromOfferAction} className="mt-3">
                  <input type="hidden" name="pro_id" value={o.pro_id} />
                  <input type="hidden" name="consultation_id" value={consult.id} />
                  <button className="btn-primary w-full py-2.5 text-[14px]">채팅하기</button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
