import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "fc_session";

// Secret randomized admin portal path (customizable in .env via ADMIN_SECRET_PATH)
const ADMIN_SECRET_PATH = process.env.ADMIN_SECRET_PATH || "atelier-studio-7k9x";

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
  const hasSession = req.cookies.has(SESSION_COOKIE);

  // 1. Anti-Reconnaissance: Block exploit probes
  if (PROBE_PATHS.some((probe) => pathname.toLowerCase().startsWith(probe))) {
    return new NextResponse("Access Denied", { status: 403 });
  }

  // 2. Anti-Scraping / Scanner: Block known attack bots
  if (BLOCKED_BOT_AGENTS.some((bot) => userAgent.includes(bot))) {
    return new NextResponse("Access Denied", { status: 403 });
  }

  // 3. Secret Admin Login & Portal Routes: Allow immediate execution
  if (pathname === `/${ADMIN_SECRET_PATH}` || pathname.startsWith(`/${ADMIN_SECRET_PATH}/`)) {
    return NextResponse.next();
  }

  // 4. Disguise default /admin/login from unauthenticated visitors/bots (Return 404)
  if (pathname === "/admin/login" && !hasSession) {
    return new NextResponse("404 Not Found", { status: 404 });
  }

  // 5. Protect direct unauthenticated /admin/* access
  const isAdminArea = pathname.startsWith("/admin") && pathname !== "/admin/login";
  if (isAdminArea && !hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = `/${ADMIN_SECRET_PATH}/login`;
    return NextResponse.redirect(url);
  }

  // 6. Fast Edge Auth Guard for protected account area
  const isAccountArea = pathname.startsWith("/account");
  if (isAccountArea && !hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*", "/:path*"],
};
