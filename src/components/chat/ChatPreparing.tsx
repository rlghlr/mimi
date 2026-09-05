import Link from "next/link";

/** Placeholder shown wherever chat is not yet available. */
export function ChatPreparing({ backHref }: { backHref: string }) {
  return (
    <div className="app-shell flex flex-col items-center justify-center px-8 py-24 text-center">
      <div className="text-5xl mb-4">💬</div>
      <h1 className="font-display text-2xl mb-2">채팅 준비 중이에요</h1>
      <p className="text-ink-2 text-[14px] leading-relaxed mb-8">
        실시간 채팅 기능은 곧 만나보실 수 있어요.<br />조금만 기다려 주세요!
      </p>
      <Link href={backHref} className="btn-primary px-6">돌아가기</Link>
    </div>
  );
}
