import Link from "next/link";
import { getSessionUser, homeFor } from "@/lib/auth";
import { redirect } from "next/navigation";

/** Landing — routes signed-in users to their home, else shows the pitch. */
export default async function Home() {
  const me = await getSessionUser();
  if (me) redirect(homeFor(me.role));

  return (
    <main className="app-shell flex flex-col">
      <section className="flex-1 flex flex-col justify-center px-7 py-16">
        <p className="font-mono text-xs tracking-[0.18em] uppercase text-accent-ink mb-5">
          Beauty Matching
        </p>
        <h1 className="font-display text-[44px] leading-[1.05] tracking-tight mb-5">
          모델과 아티스트를
          <br />
          잇는 순간, <span className="text-accent">Muse</span>
        </h1>
        <p className="text-ink-2 text-[16px] leading-relaxed mb-10 max-w-[34ch]">
          원하는 시술을 올리면 전문가가 제안하고, 전문가는 필요한 모델을
          모집해요. 탐색부터 매칭·예약·리뷰까지 한 곳에서.
        </p>

        <div className="flex flex-col gap-3">
          <Link href="/signup" className="btn-primary w-full">
            시작하기
          </Link>
          <Link href="/login" className="btn-outline w-full">
            로그인
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-3 gap-3 text-center">
          {[
            ["탐색", "공고 · 전문가"],
            ["매칭", "지원 · 제안"],
            ["예약", "시술 · 리뷰"],
          ].map(([t, s]) => (
            <div key={t} className="card px-3 py-4">
              <div className="font-display text-lg text-accent">{t}</div>
              <div className="text-[11px] text-ink-3 mt-1">{s}</div>
            </div>
          ))}
        </div>
      </section>

      <footer className="px-7 py-6 text-center text-[11px] text-ink-3 border-t border-border">
        Muse · 뷰티 모델 × 전문가 매칭 마켓플레이스
      </footer>
    </main>
  );
}
