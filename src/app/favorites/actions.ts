"use server";

import { getSessionUser } from "@/lib/auth";
import { toggleFavorite } from "@/lib/data";
import type { FavoriteTarget } from "@/lib/database.types";

/** Toggle a favorite. Returns the new state. */
export async function toggleFavoriteAction(
  targetType: FavoriteTarget,
  targetId: string
): Promise<{ favorited: boolean }> {
  const me = await getSessionUser();
  if (!me) return { favorited: false };
  const favorited = await toggleFavorite(me.id, targetType, targetId);
  return { favorited };
}
