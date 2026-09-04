import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/database.types";

export type SessionUser = {
  id: string;
  email: string | null;
  role: Role;
  status: string;
};

/** Returns the current signed-in user with role/status, or null. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("users")
    .select("id, email, role, status")
    .eq("id", user.id)
    .single();

  if (!data) return null;
  return data as SessionUser;
}

/** Home path for a role. */
export function homeFor(role: Role): string {
  if (role === "admin") return "/admin";
  if (role === "professional") return "/pro";
  return "/app";
}
