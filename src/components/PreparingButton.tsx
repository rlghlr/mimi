"use client";

const MESSAGE = "채팅은 현재 준비 중이에요. 곧 만나요!";

/** A button that shows a "service in preparation" alert instead of navigating. */
export function PreparingButton({
  children,
  className,
  message = MESSAGE,
}: {
  children: React.ReactNode;
  className?: string;
  message?: string;
}) {
  return (
    <button type="button" className={className} onClick={() => alert(message)}>
      {children}
    </button>
  );
}
