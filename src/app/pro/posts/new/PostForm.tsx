"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createPostAction, type PostFormState } from "../actions";
import { COST_TYPE_LABELS } from "@/lib/constants";

type Cat = { id: string; name: string; type: string };

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? "등록 중…" : "공고 게시"}
    </button>
  );
}

export function PostForm({ categories }: { categories: Cat[] }) {
  const [state, action] = useFormState<PostFormState, FormData>(createPostAction, {});
  const [cost, setCost] = useState("free");

  return (
    <div className="pb-10">
      <header className="sticky top-0 z-20 bg-ground/90 backdrop-blur px-4 py-3 flex items-center gap-2">
        <Link href="/pro" aria-label="뒤로" className="p-1 text-ink-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <span className="font-semibold">모델 모집 공고</span>
      </header>

      <form action={action} className="px-5 py-4 flex flex-col gap-5">
        <div>
          <label className="label" htmlFor="title">모집 제목 *</label>
          <input id="title" name="title" required className="field"
            placeholder="예: 레이어드 단발 커트 모델 구해요" />
        </div>

        <div>
          <label className="label" htmlFor="category_id">시술 카테고리</label>
          <select id="category_id" name="category_id" className="field" defaultValue="">
            <option value="" disabled>선택</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="detail">시술 상세</label>
          <textarea id="detail" name="detail" rows={3} className="field"
            placeholder="시술 내용, 결과물 사용처 등을 적어주세요." />
        </div>

        <div>
          <label className="label" htmlFor="before_condition">Before 조건</label>
          <input id="before_condition" name="before_condition" className="field"
            placeholder="예: 어깨 아래 길이, 손상 심하지 않은 모발" />
        </div>

        <fieldset className="card p-4">
          <legend className="label px-1">원하는 모델 조건</legend>
          <div className="grid grid-cols-2 gap-2.5">
            <input name="cond_gender" className="field py-2.5" placeholder="성별 (무관)" />
            <input name="cond_age" className="field py-2.5" placeholder="연령 (20~30대)" />
            <input name="cond_hair" className="field py-2.5" placeholder="헤어 길이" />
            <input name="cond_history" className="field py-2.5" placeholder="시술 이력" />
          </div>
        </fieldset>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="headcount">모집 인원</label>
            <input id="headcount" name="headcount" type="number" min={1} defaultValue={1} className="field" />
          </div>
          <div>
            <label className="label" htmlFor="duration_min">예상 소요(분)</label>
            <input id="duration_min" name="duration_min" type="number" min={0} className="field" placeholder="90" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="session_date">날짜</label>
            <input id="session_date" name="session_date" type="date" className="field" />
          </div>
          <div>
            <label className="label" htmlFor="session_time">시간</label>
            <input id="session_time" name="session_time" className="field" placeholder="오후 2:00" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="region">활동 지역</label>
            <input id="region" name="region" className="field" placeholder="강남" />
          </div>
          <div>
            <label className="label" htmlFor="place">시술 장소</label>
            <input id="place" name="place" className="field" placeholder="살롱명" />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="address">주소</label>
          <input id="address" name="address" className="field" placeholder="서울 강남구 ..." />
        </div>

        <div>
          <label className="label" htmlFor="cost_type">비용 유형</label>
          <select id="cost_type" name="cost_type" className="field" value={cost}
            onChange={(e) => setCost(e.target.value)}>
            {Object.entries(COST_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          {cost === "model_pay" && (
            <input name="pay_amount" type="number" min={0} className="field mt-2" placeholder="모델 지급 금액 (원)" />
          )}
          {cost === "material_fee" && (
            <input name="charge_amount" type="number" min={0} className="field mt-2" placeholder="모델 부담 금액 (원)" />
          )}
        </div>

        <div>
          <label className="label" htmlFor="reference_images">레퍼런스 이미지 (URL)</label>
          <textarea id="reference_images" name="reference_images" rows={2} className="field"
            placeholder="이미지 URL을 쉼표 또는 줄바꿈으로 구분" />
        </div>

        <fieldset className="card p-4">
          <legend className="label px-1">추가 동의 조건</legend>
          <div className="flex flex-col gap-2.5">
            {[
              ["agree_sns", "SNS 업로드"],
              ["agree_photo", "사진 촬영 동의"],
              ["agree_video", "영상 촬영 동의"],
              ["agree_ba", "Before/After 사용 동의"],
            ].map(([name, label]) => (
              <label key={name} className="flex items-center gap-2.5 text-[14px]">
                <input type="checkbox" name={name} className="w-4 h-4 accent-accent" />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="flex items-center gap-2.5 text-[14px] card p-3.5">
          <input type="checkbox" name="is_urgent" className="w-4 h-4 accent-accent" />
          <span className="flex-1"><b>급구</b>로 등록 (24~72시간 내, 강조 노출)</span>
          <span className="text-[11px] text-ink-3">⚡</span>
        </label>

        {state.error && <p className="text-crit text-[13px]" role="alert">{state.error}</p>}

        <Submit />
      </form>
    </div>
  );
}
