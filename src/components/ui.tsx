import Link from "next/link";
import { clsx } from "@/lib/clsx";

// ---- Badge (status pills) -------------------------------------------------
type Tone = "accent" | "gold" | "good" | "warn" | "crit" | "neutral";
const TONE: Record<Tone, string> = {
  accent: "bg-accent-soft text-accent-ink",
  gold: "bg-gold-soft text-gold",
  good: "bg-good-soft text-good",
  warn: "bg-warn-soft text-warn",
  crit: "bg-crit-soft text-crit",
  neutral: "bg-surface-2 text-ink-2",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return <span className={clsx("chip", TONE[tone], className)}>{children}</span>;
}

// map post/application status → tone
export function statusTone(status: string): Tone {
  switch (status) {
    case "recruiting":
    case "matched":
    case "confirmed":
    case "completed":
      return "good";
    case "closing_soon":
    case "reviewing":
    case "chatting":
    case "requested":
    case "upcoming":
      return "warn";
    case "cancelled":
    case "ended":
    case "rejected":
    case "no_show":
      return "crit";
    default:
      return "neutral";
  }
}

// ---- Section header -------------------------------------------------------
export function SectionHeader({
  title,
  action,
  href,
}: {
  title: string;
  action?: string;
  href?: string;
}) {
  return (
    <div className="flex items-baseline justify-between px-5 mb-3">
      <h2 className="text-[17px] font-bold tracking-tight">{title}</h2>
      {action && href && (
        <Link href={href} className="text-[13px] text-ink-3 hover:text-accent">
          {action}
        </Link>
      )}
    </div>
  );
}

// ---- Empty state ----------------------------------------------------------
export function Empty({ icon = "✦", text }: { icon?: string; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-3xl mb-3 opacity-40">{icon}</div>
      <p className="text-ink-3 text-sm">{text}</p>
    </div>
  );
}

// ---- Avatar ---------------------------------------------------------------
export function Avatar({
  src,
  name,
  size = 40,
}: {
  src?: string | null;
  name?: string | null;
  size?: number;
}) {
  const initial = (name || "?").trim().charAt(0);
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name || ""}
      width={size}
      height={size}
      className="rounded-full object-cover bg-surface-2"
      style={{ width: size, height: size }}
    />
  ) : (
    <div
      className="rounded-full bg-accent-soft text-accent-ink grid place-items-center font-semibold"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {initial}
    </div>
  );
}
