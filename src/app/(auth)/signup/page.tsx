"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { signUpAction, type AuthState } from "../actions";
import { clsx } from "@/lib/clsx";
import type { Role } from "@/lib/database.types";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? "가입 중…" : "가입 완료"}
    </button>
  );
}

const ROLES: { key: Role; title: string; desc: string; emoji: string }[] = [
  { key: "customer", title: "일반 · 모델", desc: "시술 모델로 활동하거나 상담을 받고 싶어요", emoji: "💁" },
  { key: "professional", title: "뷰티 전문가", desc: "모델을 모집하고 고객에게 제안해요", emoji: "✂️" },
];

export default function SignupPage() {
  const [role, setRole] = useState<Role>("customer");
  const [state, action] = useFormState<AuthState, FormData>(signUpAction, {});

  return (
    <main className="app-shell flex flex-col px-7 py-14">
      <Link href="/" className="text-ink-3 text-sm mb-8">← 뒤로</Link>
      <h1 className="font-display text-3xl mb-2">Muse 시작하기</h1>
      <p className="text-ink-2 mb-6">어떤 유형으로 활동하시나요?</p>

      <div className="flex flex-col gap-3 mb-7">
        {ROLES.map((r) => (
          <button
            key={r.key}
            type="button"
            onClick={() => setRole(r.key)}
            className={clsx(
              "card text-left p-4 flex items-center gap-3 transition-colors",
              role === r.key ? "border-accent ring-1 ring-accent" : "hover:bg-surface-2"
            )}
            aria-pressed={role === r.key}
          >
            <span className="text-2xl">{r.emoji}</span>
            <span className="flex-1">
              <span className="block font-bold">{r.title}</span>
              <span className="block text-[13px] text-ink-3">{r.desc}</span>
            </span>
            <span
              className={clsx(
                "w-5 h-5 rounded-full border-2 shrink-0",
                role === r.key ? "border-accent bg-accent" : "border-border-2"
              )}
            />
          </button>
        ))}
      </div>

      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="role" value={role} />
        <div>
          <label className="label" htmlFor="nickname">
            {role === "professional" ? "활동명" : "닉네임"}
          </label>
          <input id="nickname" name="nickname" required className="field"
            placeholder={role === "professional" ? "예: 수 아티스트" : "예: 미나"} />
        </div>
        <div>
          <label className="label" htmlFor="email">이메일</label>
          <input id="email" name="email" type="email" required autoComplete="email"
            className="field" placeholder="you@example.com" />
        </div>
        <div>
          <label className="label" htmlFor="password">비밀번호</label>
          <input id="password" name="password" type="password" required minLength={6}
            autoComplete="new-password" className="field" placeholder="6자 이상" />
        </div>

        {role === "professional" && (
          <p className="text-[12px] text-ink-3 bg-surface-2 rounded-xl px-3 py-2.5">
            전문가는 가입 후 <b className="text-ink-2">운영자 승인</b>을 거쳐 공고를 등록할 수 있어요.
          </p>
        )}

        {state.error && (
          <p className="text-crit text-[13px]" role="alert">{state.error}</p>
        )}

        <SubmitButton />
      </form>

      <p className="text-center text-sm text-ink-3 mt-8">
        이미 계정이 있으신가요?{" "}
        <Link href="/login" className="text-accent font-semibold">로그인</Link>
      </p>
    </main>
  );
}
