import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth/session";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

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
        return NextResponse.json({
          success: true,
          count: result.count,
          message: `Activated ${result.count} products successfully.`,
        });
      }

      case "DRAFT":
      case "INACTIVE": {
        const result = await prisma.product.updateMany({
          where: { id: { in: productIds } },
          data: { status: "DRAFT" },
        });
        return NextResponse.json({
          success: true,
          count: result.count,
          message: `Set ${result.count} products to Draft / Inactive.`,
        });
      }

      case "ARCHIVE": {
        const result = await prisma.product.updateMany({
          where: { id: { in: productIds } },
          data: { status: "ARCHIVED" },
        });
        return NextResponse.json({
          success: true,
          count: result.count,
          message: `Archived ${result.count} products successfully.`,
        });
      }

      case "CHANGE_CATEGORY": {
        if (!categoryId) {
          return NextResponse.json({ error: "No target category provided" }, { status: 400 });
        }
        const result = await prisma.product.updateMany({
          where: { id: { in: productIds } },
          data: { categoryId },
        });
        return NextResponse.json({
          success: true,
          count: result.count,
          message: `Moved ${result.count} products to new category.`,
        });
      }

      case "DELETE": {
        // Fast, non-blocking batch set deletion across all selected product IDs
        
        // 1. Unlink historical order items safely
        await prisma.orderItem.updateMany({
          where: { productId: { in: productIds } },
          data: { productId: null, variantId: null },
        });
        await prisma.orderItem.updateMany({
          where: { variant: { productId: { in: productIds } } },
          data: { productId: null, variantId: null },
        });

        // 2. Batch delete dependent child entities
        await prisma.inventoryTransaction.deleteMany({
          where: { variant: { productId: { in: productIds } } },
        });
        await prisma.cartItem.deleteMany({
          where: {
            OR: [
              { productId: { in: productIds } },
              { variant: { productId: { in: productIds } } },
            ],
          },
        });
        await prisma.wishlistItem.deleteMany({
          where: { productId: { in: productIds } },
        });
        await prisma.review.deleteMany({
          where: { productId: { in: productIds } },
        });
        await prisma.productImage.deleteMany({
          where: { productId: { in: productIds } },
        });
        await prisma.productVariant.deleteMany({
          where: { productId: { in: productIds } },
        });

        // 3. Batch delete all selected products in 1 single query
        const result = await prisma.product.deleteMany({
          where: { id: { in: productIds } },
        });

        return NextResponse.json({
          success: true,
          deletedCount: result.count,
          message: `Permanently removed ${result.count} products from catalog.`,
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
