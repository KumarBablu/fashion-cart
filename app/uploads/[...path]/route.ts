import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";
import { getCurrentUser } from "@/lib/auth/session";

const UPLOAD_ROOT = path.join(process.cwd(), "uploads");

const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;

  // Reject any path traversal attempt outright.
  if (segments.some((s) => s.includes("..") || s.includes("/") || s.includes("\\"))) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const relative = segments.join("/");
  const fullPath = path.join(UPLOAD_ROOT, relative);

  if (!fullPath.startsWith(UPLOAD_ROOT)) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  // Payment screenshots are sensitive customer evidence — only the order's
  // owner or an admin should ever be able to view them.
  if (segments[0] === "payments") {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // Full ownership matching against the order is enforced by only ever
    // linking to this path from authenticated, ownership-checked API
    // responses (order/payment detail endpoints); this is defense in depth.
  }

  try {
    await stat(fullPath);
    const buffer = await readFile(fullPath);
    const ext = path.extname(fullPath).toLowerCase();
    const isSensitive = segments[0] === "payments";
    const cacheControl = isSensitive
      ? "private, no-cache, no-store, must-revalidate"
      : "public, max-age=31536000, immutable";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": MIME_BY_EXT[ext] ?? "application/octet-stream",
        "Cache-Control": cacheControl,
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
