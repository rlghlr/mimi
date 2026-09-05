import "server-only";

import { cookies } from "next/headers";
import { adminAuth, SESSION_COOKIE } from "@/lib/firebase/admin";
import { getDoc } from "@/lib/firebase/db";
import { homeFor, type Role } from "@/lib/routes";

export type { Role };
export { homeFor };

export type SessionUser = {
  id: string;
  email: string | null;
  role: Role;
  status: string;
};

/** Returns the current signed-in user with role/status, or null. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const cookie = cookies().get(SESSION_COOKIE)?.value;
  if (!cookie) return null;

  let uid: string;
  let claimRole: Role | undefined;
  try {
    const decoded = await adminAuth.verifySessionCookie(cookie, true);
    uid = decoded.uid;
    claimRole = decoded.role as Role | undefined;
  } catch {
    return null;
  }

  const user = await getDoc<{ email: string | null; role: Role; status: string }>("users", uid);
  if (!user) {
    // Doc not provisioned yet — fall back to the token's claim.
    return { id: uid, email: null, role: claimRole ?? "customer", status: "active" };
  }
  return { id: uid, email: user.email ?? null, role: user.role, status: user.status };
}
