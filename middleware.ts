import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "fc_session";

// Known vulnerability scanners and scraping attack user agents
const BLOCKED_BOT_AGENTS = [
  "sqlmap",
  "nikto",
  "wpscan",
  "masscan",
  "zgrab",
  "acunetix",
  "nessus",
  "dirbuster",
  "gobuster",
];

// Reconnaissance probe targets to block instantly with 403 Forbidden
const PROBE_PATHS = [
  "/.env",
  "/.git",
  "/wp-login.php",
  "/wp-admin",
  "/xmlrpc.php",
  "/phpinfo.php",
  "/eval-stdin.php",
  "/actuator",
  "/.aws",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const userAgent = (req.headers.get("user-agent") || "").toLowerCase();

  // 1. Anti-Reconnaissance: Block exploit probes
  if (PROBE_PATHS.some((probe) => pathname.toLowerCase().startsWith(probe))) {
    return new NextResponse("Access Denied", { status: 403 });
  }

  // 2. Anti-Scraping / Scanner: Block known attack bots
  if (BLOCKED_BOT_AGENTS.some((bot) => userAgent.includes(bot))) {
    return new NextResponse("Access Denied", { status: 403 });
  }

  // 3. Fast Edge Auth Guard for protected panels
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
  matcher: ["/admin/:path*", "/account/:path*", "/:path*"],
};

