"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createReservationAction, type ReserveState } from "../actions";
import { won } from "@/lib/format";

const CONSENTS = [
  ["c_face", "얼굴 촬영"],
  ["c_process", "시술 과정 촬영"],
  ["c_ba", "Before/After 사진"],
  ["c_sns", "SNS 게시"],
  ["c_ad", "광고 활용"],
  ["c_portfolio", "포트폴리오 활용"],
] as const;

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? "요청 중…" : "동의하고 예약 요청"}
    </button>
  );
}

export function ReserveForm({
  proId, proName, shopName, services,
}: {
  proId: string; proName: string; shopName: string | null; services: string[];
}) {
  const [state, action] = useFormState<ReserveState, FormData>(createReservationAction, {});
  const [amount, setAmount] = useState(0);
  const [discount, setDiscount] = useState(0);
  const final = Math.max(0, amount - discount);

  return (
    <div className="pb-10">
      <header className="sticky top-0 z-20 bg-ground/90 backdrop-blur px-4 py-3 flex items-center gap-2">
        <Link href={`/app/pros/${proId}`} aria-label="뒤로" className="p-1 text-ink-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M15 18l-6-6 6-6" /></svg>
        </Link>
        <span className="font-semibold">예약하기</span>
      </header>

      <form action={action} className="px-5 py-4 flex flex-col gap-5">
        <input type="hidden" name="pro_id" value={proId} />

        <div className="card p-4 text-[13px]">
          <div className="flex justify-between py-1"><span className="text-ink-3">전문가</span><span className="font-medium">{proName}</span></div>
          {shopName && <div className="flex justify-between py-1"><span className="text-ink-3">매장</span><span className="font-medium">{shopName}</span></div>}
        </div>

        <div>
          <label className="label" htmlFor="service">시술</label>
          {services.length > 0 ? (
            <select id="service" name="service" className="field" defaultValue="">
              <option value="" disabled>선택</option>
              {services.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          ) : (
            <input id="service" name="service" className="field" placeholder="시술명" />
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div><label className="label" htmlFor="session_date">날짜</label><input id="session_date" name="session_date" type="date" className="field" /></div>
          <div><label className="label" htmlFor="session_time">시간</label><input id="session_time" name="session_time" className="field" placeholder="오후 2:00" /></div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div><label className="label" htmlFor="duration_min">소요(분)</label><input id="duration_min" name="duration_min" type="number" min={0} className="field" placeholder="90" /></div>
          <div><label className="label" htmlFor="amount">금액</label><input id="amount" name="amount" type="number" min={0} className="field" value={amount || ""} onChange={(e) => setAmount(Number(e.target.value))} placeholder="0" /></div>
          <div><label className="label" htmlFor="discount">할인</label><input id="discount" name="discount" type="number" min={0} className="field" value={discount || ""} onChange={(e) => setDiscount(Number(e.target.value))} placeholder="0" /></div>
        </div>

        <div className="card p-4 flex justify-between items-center">
          <span className="font-semibold">최종 결제금액</span>
          <span className="font-bold text-accent-ink text-lg">{final === 0 ? "무료" : won(final)}</span>
        </div>

        {/* electronic consent */}
        <div>
          <p className="font-bold text-[15px] mb-1">전자 초상권 동의</p>
          <p className="text-[12px] text-ink-3 mb-3">항목별로 동의 여부를 선택하세요. 동의 내역은 안전하게 기록돼요.</p>
          <div className="card p-4 flex flex-col gap-3">
            {CONSENTS.map(([name, label]) => (
              <label key={name} className="flex items-center justify-between text-[14px]">
                <span>{label}</span>
                <input type="checkbox" name={name} className="w-5 h-5 accent-accent" />
              </label>
            ))}
          </div>
        </div>

        {state.error && <p className="text-crit text-[13px]" role="alert">{state.error}</p>}
        <Submit />
      </form>
    </div>
  );
}
