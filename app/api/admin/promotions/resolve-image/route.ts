import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get("url")?.trim();

  if (!targetUrl) {
    return NextResponse.json({ error: "No URL provided" }, { status: 400 });
  }

  try {
    // 1. Check if URL already contains Google imgurl parameter
    const imgUrlMatch = targetUrl.match(/[?&]imgurl=([^&]+)/);
    if (imgUrlMatch && imgUrlMatch[1]) {
      return NextResponse.json({ resolvedUrl: decodeURIComponent(imgUrlMatch[1]) });
    }

    // 2. Follow redirects (e.g. share.google shortlinks)
    const res = await fetch(targetUrl, {
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    const finalUrl = res.url;

    // Check if the final URL has imgurl query param
    const finalImgUrlMatch = finalUrl.match(/[?&]imgurl=([^&]+)/);
    if (finalImgUrlMatch && finalImgUrlMatch[1]) {
      return NextResponse.json({ resolvedUrl: decodeURIComponent(finalImgUrlMatch[1]) });
    }

    const contentType = res.headers.get("content-type") || "";

    // If it's a direct image
    if (contentType.startsWith("image/")) {
      return NextResponse.json({ resolvedUrl: finalUrl });
    }

    // If it's an HTML page, inspect for og:image or meta image tags
    const html = await res.text();
    const ogImageMatch =
      html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
      html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i) ||
      html.match(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i);

    if (ogImageMatch && ogImageMatch[1]) {
      let ogUrl = ogImageMatch[1];
      if (ogUrl.startsWith("//")) ogUrl = "https:" + ogUrl;
      return NextResponse.json({ resolvedUrl: ogUrl });
    }

    return NextResponse.json({ resolvedUrl: finalUrl });
  } catch (error) {
    console.error("Error resolving image URL:", error);
    return NextResponse.json({ resolvedUrl: targetUrl });
  }
}
