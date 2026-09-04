"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { signInAction, type AuthState } from "../actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? "로그인 중…" : "로그인"}
    </button>
  );
}

export default function LoginPage() {
  const [state, action] = useFormState<AuthState, FormData>(signInAction, {});

  return (
    <main className="app-shell flex flex-col px-7 py-14">
      <Link href="/" className="text-ink-3 text-sm mb-10">
        ← 뒤로
      </Link>
      <h1 className="font-display text-3xl mb-2">다시 오셨네요</h1>
      <p className="text-ink-2 mb-8">Muse 계정으로 로그인하세요.</p>

      <form action={action} className="flex flex-col gap-4">
        <div>
          <label className="label" htmlFor="email">이메일</label>
          <input id="email" name="email" type="email" required autoComplete="email"
            className="field" placeholder="you@example.com" />
        </div>
        <div>
          <label className="label" htmlFor="password">비밀번호</label>
          <input id="password" name="password" type="password" required
            autoComplete="current-password" className="field" placeholder="••••••••" />
        </div>

        {state.error && (
          <p className="text-crit text-[13px]" role="alert">{state.error}</p>
        )}

        <SubmitButton />
      </form>

      <p className="text-center text-sm text-ink-3 mt-8">
        아직 계정이 없으신가요?{" "}
        <Link href="/signup" className="text-accent font-semibold">가입하기</Link>
      </p>
    </main>
  );
}
