import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/firebase/admin";

export const runtime = "nodejs";

/** Exchange a Firebase ID token for an httpOnly session cookie. */
export async function POST(req: NextRequest) {
  const { idToken } = await req.json().catch(() => ({ idToken: null }));
  if (!idToken) {
    return NextResponse.json({ error: "ID_TOKEN_REQUIRED" }, { status: 400 });
  }
  try {
    // Reject tokens older than 5 minutes to limit replay.
    const decoded = await adminAuth.verifyIdToken(idToken, true);
    if (Date.now() / 1000 - decoded.auth_time > 5 * 60) {
      return NextResponse.json({ error: "RECENT_SIGNIN_REQUIRED" }, { status: 401 });
    }
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_MAX_AGE * 1000,
    });
    cookies().set(SESSION_COOKIE, sessionCookie, {
      maxAge: SESSION_MAX_AGE,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "INVALID_TOKEN" }, { status: 401 });
  }
}

/** Clear the session cookie (sign out). */
export async function DELETE() {
  cookies().delete(SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}
