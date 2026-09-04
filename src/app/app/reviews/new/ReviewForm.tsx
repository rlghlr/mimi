"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createReviewAction, type ReviewState } from "../actions";
import { clsx } from "@/lib/clsx";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? "등록 중…" : "리뷰 등록"}
    </button>
  );
}

export function ReviewForm({
  reservationId, service, proName,
}: {
  reservationId: string; service: string; proName: string;
}) {
  const [state, action] = useFormState<ReviewState, FormData>(createReviewAction, {});
  const [rating, setRating] = useState(5);

  return (
    <div className="pb-10">
      <header className="sticky top-0 z-20 bg-ground/90 backdrop-blur px-4 py-3 flex items-center gap-2">
        <Link href="/app/my/reservations" aria-label="뒤로" className="p-1 text-ink-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M15 18l-6-6 6-6" /></svg>
        </Link>
        <span className="font-semibold">리뷰 작성</span>
      </header>

      <form action={action} className="px-5 py-5 flex flex-col gap-5">
        <input type="hidden" name="reservation_id" value={reservationId} />
        <input type="hidden" name="rating" value={rating} />

        <div className="text-center">
          <p className="text-[14px] text-ink-2 mb-1">{proName}님의 시술은 만족스러우셨나요?</p>
          <div className="flex justify-center gap-1.5 mt-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n}점`}
                className={clsx("text-[34px] leading-none transition-colors", n <= rating ? "text-accent" : "text-border-2")}>
                ★
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label" htmlFor="service_name">시술명</label>
          <input id="service_name" name="service_name" defaultValue={service} className="field" placeholder="예: 레이어드 단발 커트" />
        </div>

        <div>
          <label className="label" htmlFor="text">리뷰</label>
          <textarea id="text" name="text" rows={4} className="field" placeholder="시술은 어떠셨나요? 솔직한 후기를 남겨주세요." />
        </div>

        <div>
          <label className="label" htmlFor="photos">사진 (URL)</label>
          <textarea id="photos" name="photos" rows={2} className="field" placeholder="이미지 URL을 쉼표/줄바꿈으로 구분" />
          <p className="text-[11px] text-ink-3 mt-1.5">사진을 첨부하면 포토리뷰로 표시돼요.</p>
        </div>

        {state.error && <p className="text-crit text-[13px]" role="alert">{state.error}</p>}
        <Submit />
      </form>
    </div>
  );
}
