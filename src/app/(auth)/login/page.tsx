"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "@/lib/firebase/auth-client";
import { homeFor } from "@/lib/routes";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") || "").trim();
    const password = String(fd.get("password") || "");
    try {
      const role = await signIn(email, password);
      router.replace(params.get("next") || homeFor(role));
      router.refresh();
    } catch {
      setError("이메일 또는 비밀번호가 올바르지 않아요.");
      setPending(false);
    }
  }

  return (
    <main className="app-shell flex flex-col px-7 py-14">
      <Link href="/" className="text-ink-3 text-sm mb-10">
        ← 뒤로
      </Link>
      <h1 className="font-display text-3xl mb-2">다시 오셨네요</h1>
      <p className="text-ink-2 mb-8">Muse 계정으로 로그인하세요.</p>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
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

        {error && <p className="text-crit text-[13px]" role="alert">{error}</p>}

        <button type="submit" className="btn-primary w-full" disabled={pending}>
          {pending ? "로그인 중…" : "로그인"}
        </button>
      </form>

      <p className="text-center text-sm text-ink-3 mt-8">
        아직 계정이 없으신가요?{" "}
        <Link href="/signup" className="text-accent font-semibold">가입하기</Link>
      </p>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
