"use client";

import { useState, useTransition } from "react";
import { toggleFavoriteAction } from "@/app/favorites/actions";
import { clsx } from "@/lib/clsx";
import type { FavoriteTarget } from "@/lib/database.types";

export function FavoriteButton({
  targetType,
  targetId,
  initial,
  size = 24,
}: {
  targetType: FavoriteTarget;
  targetId: string;
  initial: boolean;
  size?: number;
}) {
  const [fav, setFav] = useState(initial);
  const [pending, start] = useTransition();

  return (
    <button
      aria-label={fav ? "찜 해제" : "찜하기"}
      aria-pressed={fav}
      disabled={pending}
      onClick={() =>
        start(async () => {
          setFav((v) => !v); // optimistic
          const res = await toggleFavoriteAction(targetType, targetId);
          setFav(res.favorited);
        })
      }
      className={clsx("p-1.5 transition-colors", fav ? "text-accent" : "text-ink-3")}
    >
      <svg width={size} height={size} viewBox="0 0 24 24"
        fill={fav ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7">
        <path d="M12 21s-7.5-5-9.5-9A5 5 0 0112 5a5 5 0 019.5 7c-2 4-9.5 9-9.5 9z" />
      </svg>
    </button>
  );
}
