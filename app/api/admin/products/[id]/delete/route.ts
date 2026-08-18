import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth/session";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const hard = req.nextUrl.searchParams.get("hard") === "true";

  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { orderItems: { take: 1 } },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // If product has existing historical customer orders and hard delete is requested, soft-archive it instead
    if (product.orderItems.length > 0 || !hard) {
      const updated = await prisma.product.update({
        where: { id },
        data: { status: "ARCHIVED" },
      });
      return NextResponse.json({
        success: true,
        archived: true,
        message: "Product archived successfully (preserved for historical orders).",
        product: updated,
      });
    }

    // Otherwise, safe to hard delete product and cascade clean images/variants
    await prisma.$transaction(async (tx) => {
      await tx.productImage.deleteMany({ where: { productId: id } });
      await tx.cartItem.deleteMany({ where: { productId: id } });
      await tx.wishlistItem.deleteMany({ where: { productId: id } });
      await tx.review.deleteMany({ where: { productId: id } });
      await tx.productVariant.deleteMany({ where: { productId: id } });
      await tx.product.delete({ where: { id } });
    });

    return NextResponse.json({
      success: true,
      deleted: true,
      message: "Product permanently removed from database.",
    });
  } catch (err: unknown) {
    console.error("Delete product error:", err);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
