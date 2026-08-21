import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body || !Array.isArray(body.productIds) || body.productIds.length === 0) {
      return NextResponse.json({ error: "No products selected" }, { status: 400 });
    }

    const { productIds, action, categoryId } = body;

    switch (action) {
      case "ACTIVATE": {
        const result = await prisma.product.updateMany({
          where: { id: { in: productIds } },
          data: { status: "ACTIVE" },
        });
        return NextResponse.json({ success: true, count: result.count, message: `Activated ${result.count} products` });
      }

      case "DRAFT": {
        const result = await prisma.product.updateMany({
          where: { id: { in: productIds } },
          data: { status: "DRAFT" },
        });
        return NextResponse.json({ success: true, count: result.count, message: `Set ${result.count} products to Draft / Hidden` });
      }

      case "ARCHIVE": {
        const result = await prisma.product.updateMany({
          where: { id: { in: productIds } },
          data: { status: "ARCHIVED" },
        });
        return NextResponse.json({ success: true, count: result.count, message: `Archived ${result.count} products` });
      }

      case "CHANGE_CATEGORY": {
        if (!categoryId) {
          return NextResponse.json({ error: "No target category provided" }, { status: 400 });
        }
        const result = await prisma.product.updateMany({
          where: { id: { in: productIds } },
          data: { categoryId },
        });
        return NextResponse.json({ success: true, count: result.count, message: `Moved ${result.count} products to category` });
      }

      case "DELETE": {
        let deletedCount = 0;

        await prisma.$transaction(async (tx) => {
          for (const prodId of productIds) {
            // Unlink order items safely
            await tx.orderItem.updateMany({
              where: { productId: prodId },
              data: { productId: null, variantId: null },
            });
            await tx.orderItem.updateMany({
              where: { variant: { productId: prodId } },
              data: { productId: null, variantId: null },
            });

            // Delete child relations
            await tx.inventoryTransaction.deleteMany({ where: { variant: { productId: prodId } } });
            await tx.cartItem.deleteMany({ where: { productId: prodId } });
            await tx.cartItem.deleteMany({ where: { variant: { productId: prodId } } });
            await tx.wishlistItem.deleteMany({ where: { productId: prodId } });
            await tx.review.deleteMany({ where: { productId: prodId } });
            await tx.productImage.deleteMany({ where: { productId: prodId } });
            await tx.productVariant.deleteMany({ where: { productId: prodId } });

            // Delete product
            await tx.product.delete({ where: { id: prodId } });
            deletedCount++;
          }
        });

        return NextResponse.json({
          success: true,
          deletedCount,
          archivedCount: 0,
          message: `Permanently removed ${deletedCount} products from database.`,
        });
      }

      default:
        return NextResponse.json({ error: "Invalid bulk action" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Bulk product operation error:", error);
    return NextResponse.json({ error: error.message || "Failed to process bulk operation" }, { status: 500 });
  }
}
