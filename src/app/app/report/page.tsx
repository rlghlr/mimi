import Link from "next/link";
import { ReportForm } from "./ReportForm";

export const dynamic = "force-dynamic";

export default function ReportPage({
  searchParams,
}: {
  searchParams: { type?: string; id?: string; chat?: string; back?: string };
}) {
  const { type = "user", id = "", chat, back = "/app" } = searchParams;

  return (
    <div className="pb-10">
      <header className="sticky top-0 z-20 bg-ground/90 backdrop-blur px-4 py-3 flex items-center gap-2">
        <Link href={back} aria-label="뒤로" className="p-1 text-ink-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M15 18l-6-6 6-6" /></svg>
        </Link>
        <span className="font-semibold">신고하기</span>
      </header>
      <ReportForm targetType={type} targetId={id} chatId={chat} back={back} />
    </div>
  );
}
