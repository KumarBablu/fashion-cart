import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get("url")?.trim();

  if (!targetUrl) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  // Handle data URLs directly
  if (targetUrl.startsWith("data:")) {
    return NextResponse.redirect(targetUrl);
  }

  try {
    // 1. Follow redirects and fetch with standard browser headers
    let finalFetchUrl = targetUrl;
    
    // Auto-extract imgurl query param if present
    const imgUrlMatch = targetUrl.match(/[?&]imgurl=([^&]+)/);
    if (imgUrlMatch && imgUrlMatch[1]) {
      try {
        finalFetchUrl = decodeURIComponent(imgUrlMatch[1]);
      } catch {}
    }

    // Google Drive direct stream format
    const gDriveMatch =
      finalFetchUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
      finalFetchUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (gDriveMatch && gDriveMatch[1]) {
      finalFetchUrl = `https://lh3.googleusercontent.com/d/${gDriveMatch[1]}`;
    }

    const response = await fetch(finalFetchUrl, {
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: `Upstream error ${response.status}` }, { status: response.status });
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const imageBuffer = await response.arrayBuffer();

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Error proxying image:", error);
    return NextResponse.json({ error: "Failed to fetch image" }, { status: 500 });
  }
}
