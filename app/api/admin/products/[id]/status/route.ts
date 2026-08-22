import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const body = await req.json().catch(() => ({}));
    const status = body.status;

    if (!status || !["ACTIVE", "DRAFT", "ARCHIVED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    const updated = await prisma.product.update({
      where: { id },
      data: { status },
      select: { id: true, name: true, status: true },
    });

    return NextResponse.json({
      success: true,
      product: updated,
      message: `Status updated to ${status}.`,
    });
  } catch (err: any) {
    console.error("Status update error:", err);
    return NextResponse.json({ error: err.message || "Failed to update product status" }, { status: 500 });
  }
}
