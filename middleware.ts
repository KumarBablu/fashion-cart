import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "fc_session";

// Middleware only checks for cookie *presence* (fast, edge-safe). The
// authoritative check — is this actually a valid, non-expired session,
// and does the user have the ADMIN role — happens in each server
// component/route handler via getCurrentUser()/getCurrentAdmin(), which
// hit the database. This middleware just avoids rendering protected
// pages at all for obviously logged-out visitors.
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = req.cookies.has(SESSION_COOKIE);

  const isAdminArea = pathname.startsWith("/admin") && pathname !== "/admin/login";
  const isAccountArea = pathname.startsWith("/account");

  if ((isAdminArea || isAccountArea) && !hasSession) {
    const loginPath = isAdminArea ? "/admin/login" : "/login";
    const url = req.nextUrl.clone();
    url.pathname = loginPath;
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*"],
};
