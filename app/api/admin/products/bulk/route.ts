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
        // Delete related variants, images, reviews, wishlists, and cart items safely
        let deletedCount = 0;
        let archivedCount = 0;

        for (const prodId of productIds) {
          const hasOrders = await prisma.orderItem.count({
            where: { productId: prodId },
          });

          if (hasOrders === 0) {
            await prisma.cartItem.deleteMany({ where: { variant: { productId: prodId } } });
            await prisma.wishlistItem.deleteMany({ where: { productId: prodId } });
            await prisma.review.deleteMany({ where: { productId: prodId } });
            await prisma.productImage.deleteMany({ where: { productId: prodId } });
            await prisma.inventoryTransaction.deleteMany({ where: { variant: { productId: prodId } } });
            await prisma.productVariant.deleteMany({ where: { productId: prodId } });
            await prisma.product.delete({ where: { id: prodId } });
            deletedCount++;
          } else {
            await prisma.product.update({
              where: { id: prodId },
              data: { status: "ARCHIVED" },
            });
            archivedCount++;
          }
        }

        return NextResponse.json({
          success: true,
          deletedCount,
          archivedCount,
          message: `Processed deletion: ${deletedCount} deleted permanently, ${archivedCount} archived to preserve orders.`,
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
