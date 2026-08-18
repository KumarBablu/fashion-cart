import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth/session";

async function handleDeleteOrArchive(req: NextRequest, id: string) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let hard = req.nextUrl.searchParams.get("hard") === "true";
  if (req.method === "POST") {
    try {
      const body = await req.json().catch(() => null);
      if (body && typeof body.hard === "boolean") {
        hard = body.hard;
      }
    } catch {
      // ignore
    }
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { orderItems: { take: 1 } },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // If product has existing historical customer orders or soft archive is requested:
    if (product.orderItems.length > 0 || !hard) {
      const updated = await prisma.product.update({
        where: { id },
        data: { status: "ARCHIVED" },
      });
      return NextResponse.json({
        success: true,
        archived: true,
        deleted: false,
        message: "Product archived successfully (preserved for historical orders).",
        product: updated,
      });
    }

    // Otherwise, safe to hard delete product and cascade clean relations
    await prisma.$transaction(async (tx) => {
      await tx.productImage.deleteMany({ where: { productId: id } });
      await tx.inventoryTransaction.deleteMany({ where: { variant: { productId: id } } });
      await tx.cartItem.deleteMany({ where: { productId: id } });
      await tx.wishlistItem.deleteMany({ where: { productId: id } });
      await tx.review.deleteMany({ where: { productId: id } });
      await tx.productVariant.deleteMany({ where: { productId: id } });
      await tx.product.delete({ where: { id } });
    });

    return NextResponse.json({
      success: true,
      deleted: true,
      archived: false,
      message: "Product permanently removed from database.",
    });
  } catch (err: unknown) {
    console.error("Delete product error:", err);
    return NextResponse.json({ error: "Failed to delete product: " + (err as Error)?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handleDeleteOrArchive(req, id);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handleDeleteOrArchive(req, id);
}
