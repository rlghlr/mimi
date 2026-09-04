import Link from "next/link";

/** Placeholder for routes planned in MVP 2/3차. */
export function ComingSoon({
  title,
  phase = "MVP 2차",
  back = "/app",
  desc,
}: {
  title: string;
  phase?: string;
  back?: string;
  desc?: string;
}) {
  return (
    <div className="px-6 py-20 text-center flex flex-col items-center">
      <div className="text-4xl mb-4 opacity-40">✦</div>
      <span className="chip bg-surface-2 text-ink-3 mb-3">{phase}</span>
      <h1 className="font-display text-2xl mb-2">{title}</h1>
      <p className="text-ink-2 text-sm max-w-[30ch] mb-8">
        {desc ?? "이 기능은 곧 제공될 예정이에요. 현재 설계·개발 로드맵에 포함되어 있어요."}
      </p>
      <Link href={back} className="btn-outline px-6">돌아가기</Link>
    </div>
  );
}
