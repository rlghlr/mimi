"use server";

import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import type { FavoriteTarget } from "@/lib/database.types";

/** Toggle a favorite. Returns the new state. */
export async function toggleFavoriteAction(
  targetType: FavoriteTarget,
  targetId: string
): Promise<{ favorited: boolean }> {
  const me = await getSessionUser();
  if (!me) return { favorited: false };
  const supabase = createClient();

  const { data: existing } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", me.id)
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .maybeSingle();

  if (existing) {
    await supabase.from("favorites").delete().eq("id", existing.id);
    return { favorited: false };
  }
  await supabase.from("favorites").insert({ user_id: me.id, target_type: targetType, target_id: targetId });
  return { favorited: true };
}
