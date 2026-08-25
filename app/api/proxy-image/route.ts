import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function isForbiddenHost(hostname: string): boolean {
  // Strip IPv6 brackets and trailing dots
  const h = hostname.toLowerCase().trim().replace(/^\[|\]$/g, "").replace(/\.+$/, "");

  if (
    h === "localhost" ||
    h === "127.0.0.1" ||
    h === "0.0.0.0" ||
    h === "::1" ||
    h === "169.254.169.254" ||
    h.endsWith(".internal") ||
    h.endsWith(".local") ||
    h.endsWith(".localhost") ||
    h.endsWith(".arpa")
  ) {
    return true;
  }

  // IPv6 loopback, link-local, unique local
  if (h.startsWith("::") || h.startsWith("fe80:") || h.startsWith("fc00:") || h.startsWith("fd00:")) return true;
  if (h.includes("::ffff:")) {
    const v4 = h.split("::ffff:")[1];
    if (v4 && isForbiddenHost(v4)) return true;
  }

  // Private IPv4 ranges and loopback
  if (/^10\./.test(h)) return true;
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(h)) return true;
  if (/^192\.168\./.test(h)) return true;
  if (/^169\.254\./.test(h)) return true;
  if (/^127\./.test(h)) return true;
  if (/^0\./.test(h)) return true;

  // Single integer or decimal IP notation
  if (/^\d+$/.test(h)) {
    const num = parseInt(h, 10);
    if (!isNaN(num)) {
      const ip1 = (num >>> 24) & 255;
      const ip2 = (num >>> 16) & 255;
      if (ip1 === 127 || ip1 === 10 || ip1 === 0) return true;
      if (ip1 === 169 && ip2 === 254) return true;
      if (ip1 === 192 && ip2 === 168) return true;
      if (ip1 === 172 && ip2 >= 16 && ip2 <= 31) return true;
    }
  }

  return false;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get("url")?.trim();

  if (!targetUrl) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  // Handle data URLs directly
  if (targetUrl.startsWith("data:")) {
    if (targetUrl.startsWith("data:image/")) {
      return NextResponse.redirect(targetUrl);
    }
    return NextResponse.json({ error: "Invalid data URL format" }, { status: 400 });
  }

  try {
    let currentFetchUrl = targetUrl;
    
    // Auto-extract imgurl query param if present
    const imgUrlMatch = targetUrl.match(/[?&]imgurl=([^&]+)/);
    if (imgUrlMatch && imgUrlMatch[1]) {
      try {
        currentFetchUrl = decodeURIComponent(imgUrlMatch[1]);
      } catch {}
    }

    // Google Drive direct stream format
    const gDriveMatch =
      currentFetchUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
      currentFetchUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (gDriveMatch && gDriveMatch[1]) {
      currentFetchUrl = `https://lh3.googleusercontent.com/d/${gDriveMatch[1]}`;
    }

    const MAX_REDIRECTS = 5;
    let response: Response | null = null;

    for (let hop = 0; hop < MAX_REDIRECTS; hop++) {
      let parsed: URL;
      try {
        parsed = new URL(currentFetchUrl);
      } catch {
        return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
      }

      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return NextResponse.json({ error: "Unsupported protocol" }, { status: 400 });
      }

      if (isForbiddenHost(parsed.hostname)) {
        return NextResponse.json({ error: "Access to private or local network is forbidden" }, { status: 403 });
      }

      const res = await fetch(currentFetchUrl, {
        redirect: "manual",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        },
      });

      // Handle redirect manually with destination host validation
      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get("location");
        if (!location) {
          return NextResponse.json({ error: "Redirect missing location header" }, { status: 502 });
        }
        currentFetchUrl = new URL(location, currentFetchUrl).toString();
        continue;
      }

      response = res;
      break;
    }

    if (!response) {
      return NextResponse.json({ error: "Too many redirects" }, { status: 502 });
    }

    if (!response.ok) {
      return NextResponse.json({ error: `Upstream error ${response.status}` }, { status: response.status });
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.toLowerCase().startsWith("image/")) {
      return NextResponse.json({ error: "Target URL does not return an image" }, { status: 400 });
    }

    const imageBuffer = await response.arrayBuffer();
    if (imageBuffer.byteLength > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Image exceeds 10MB limit" }, { status: 413 });
    }

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
        "Access-Control-Allow-Origin": "*",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Error proxying image:", error);
    return NextResponse.json({ error: "Failed to fetch image" }, { status: 500 });
  }
}
