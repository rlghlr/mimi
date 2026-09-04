"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { applyAction, type ApplyState } from "../../actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? "제출 중…" : "지원 제출"}
    </button>
  );
}

export default function ApplyPage({ params }: { params: { id: string } }) {
  const [state, action] = useFormState<ApplyState, FormData>(applyAction, {});

  return (
    <div className="pb-8">
      <header className="sticky top-0 z-20 bg-ground/90 backdrop-blur px-4 py-3 flex items-center gap-2">
        <Link href={`/app/posts/${params.id}`} aria-label="뒤로" className="p-1 text-ink-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <span className="font-semibold">모델 지원서</span>
      </header>

      <form action={action} className="px-5 py-4 flex flex-col gap-5">
        <input type="hidden" name="post_id" value={params.id} />

        <div>
          <p className="label mb-2">현재 모습 사진 (URL)</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              ["photo_front", "정면"],
              ["photo_side", "측면"],
              ["photo_back", "후면"],
            ].map(([name, ph]) => (
              <input key={name} name={name} className="field text-[13px] px-3 py-2.5" placeholder={ph} />
            ))}
          </div>
          <p className="text-[11px] text-ink-3 mt-1.5">* MVP에선 이미지 URL로 입력해요. (추후 업로드 지원)</p>
        </div>

        <div>
          <label className="label" htmlFor="current_state">현재 시술 상태</label>
          <input id="current_state" name="current_state" className="field"
            placeholder="예: 6개월 전 갈색 염색, 어깨 길이" />
        </div>

        <div>
          <label className="label" htmlFor="recent_history">최근 시술 이력</label>
          <textarea id="recent_history" name="recent_history" rows={2} className="field"
            placeholder="예: 3개월 전 클리닉 시술" />
        </div>

        <div>
          <label className="label" htmlFor="available_dates">가능 날짜</label>
          <input id="available_dates" name="available_dates" className="field"
            placeholder="예: 3/5, 3/6 오후, 3/8" />
          <p className="text-[11px] text-ink-3 mt-1.5">쉼표로 구분해 여러 날짜를 입력하세요.</p>
        </div>

        <div>
          <label className="label" htmlFor="message">지원 메시지</label>
          <textarea id="message" name="message" rows={3} className="field"
            placeholder="전문가에게 전할 말을 적어주세요." />
        </div>

        {state.error && <p className="text-crit text-[13px]" role="alert">{state.error}</p>}

        <Submit />
      </form>
    </div>
  );
}
