"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { createConsultationAction, type ConsultState } from "../actions";

type Cat = { id: string; name: string; type: string };

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? "등록 중…" : "상담 등록"}
    </button>
  );
}

export function ConsultForm({ categories }: { categories: Cat[] }) {
  const [state, action] = useFormState<ConsultState, FormData>(createConsultationAction, {});

  return (
    <div className="pb-10">
      <header className="sticky top-0 z-20 bg-ground/90 backdrop-blur px-4 py-3 flex items-center gap-2">
        <Link href="/app/consult" aria-label="뒤로" className="p-1 text-ink-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <span className="font-semibold">뷰티 상담 등록</span>
      </header>

      <form action={action} className="px-5 py-4 flex flex-col gap-5">
        <div>
          <label className="label" htmlFor="category_id">상담 카테고리</label>
          <select id="category_id" name="category_id" className="field" defaultValue="">
            <option value="" disabled>선택</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="content">고민 내용 *</label>
          <textarea id="content" name="content" required rows={4} className="field"
            placeholder="예: 단발이 어울릴지 상담받고 싶어요. 염색으로 머릿결이 상한 상태예요." />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="region">희망 지역</label>
            <input id="region" name="region" className="field" placeholder="강남" />
          </div>
          <div>
            <label className="label" htmlFor="budget">예상 예산(원)</label>
            <input id="budget" name="budget" type="number" min={0} className="field" placeholder="50000" />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="available_dates">가능 날짜</label>
          <input id="available_dates" name="available_dates" className="field" placeholder="예: 3/5, 3/8 오후" />
        </div>

        <div>
          <p className="label mb-2">현재 / 원하는 스타일 사진 (URL)</p>
          <div className="grid grid-cols-2 gap-2">
            <input name="current_photo" className="field py-2.5 text-[13px]" placeholder="현재 사진" />
            <input name="desired_photo" className="field py-2.5 text-[13px]" placeholder="원하는 스타일" />
          </div>
        </div>

        {state.error && <p className="text-crit text-[13px]" role="alert">{state.error}</p>}
        <Submit />
      </form>
    </div>
  );
}
