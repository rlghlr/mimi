"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { sendOfferAction, type OfferState } from "./actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full py-2.5 text-[14px]" disabled={pending}>
      {pending ? "보내는 중…" : "제안 보내기"}
    </button>
  );
}

export function OfferComposer({ consultationId }: { consultationId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useFormState<OfferState, FormData>(sendOfferAction, {});

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-outline w-full py-2.5 text-[14px] mt-3">
        제안 보내기
      </button>
    );
  }

  return (
    <form action={action} className="mt-3 flex flex-col gap-2.5 border-t border-border pt-3">
      <input type="hidden" name="consultation_id" value={consultationId} />
      <input name="recommend" className="field py-2.5 text-[14px]" placeholder="추천 시술 (예: 레이어드 단발)" />
      <input name="method" className="field py-2.5 text-[14px]" placeholder="시술 방법 · 예상 스타일" />
      <div className="grid grid-cols-2 gap-2">
        <input name="price" type="number" min={0} className="field py-2.5 text-[14px]" placeholder="예상 비용(원)" />
        <input name="duration_min" type="number" min={0} className="field py-2.5 text-[14px]" placeholder="소요(분)" />
      </div>
      <input name="available_dates" className="field py-2.5 text-[14px]" placeholder="가능 날짜 (쉼표 구분)" />
      <textarea name="message" rows={2} className="field text-[14px]" placeholder="추가 메시지" />
      {state.error && <p className="text-crit text-[13px]" role="alert">{state.error}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={() => setOpen(false)} className="btn-ghost px-4 py-2.5 text-[14px]">취소</button>
        <div className="flex-1"><Submit /></div>
      </div>
    </form>
  );
}
