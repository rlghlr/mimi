import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "__session";

/**
 * Lightweight routing gate. The Edge runtime cannot run the Firebase Admin
 * SDK, so this only checks for the presence of a session cookie; full
 * verification (and role checks) happen server-side via getSessionUser().
 */
export function middleware(request: NextRequest) {
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
  const path = request.nextUrl.pathname;

  const isProtected =
    path.startsWith("/app") || path.startsWith("/pro") || path.startsWith("/admin");
  const isAuthPage = path.startsWith("/login") || path.startsWith("/signup");

  if (!hasSession && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  if (hasSession && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/app";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
