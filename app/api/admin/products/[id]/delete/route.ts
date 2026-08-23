import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth/session";

async function handleDeleteOrArchive(req: NextRequest, id: string) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const store = searchParams.get("store") || req.cookies.get("fc_admin_store")?.value || "garments";
  let db = getDb(store === "jewellery" ? "jewellery" : "garments");

  try {
    let product = await db.product.findUnique({ where: { id } });
    if (!product) {
      db = getDb(store === "jewellery" ? "garments" : "jewellery");
      product = await db.product.findUnique({ where: { id } });
    }

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Permanently remove product: unlink historical order items and cascade delete all relations
    await db.$transaction(async (tx: any) => {
      // Unlink order items safely
      await tx.orderItem.updateMany({
        where: { productId: id },
        data: { productId: null, variantId: null },
      });
      await tx.orderItem.updateMany({
        where: { variant: { productId: id } },
        data: { productId: null, variantId: null },
      });

      // Delete child relations
      await tx.inventoryTransaction.deleteMany({ where: { variant: { productId: id } } });
      await tx.cartItem.deleteMany({ where: { productId: id } });
      await tx.cartItem.deleteMany({ where: { variant: { productId: id } } });
      await tx.wishlistItem.deleteMany({ where: { productId: id } });
      await tx.review.deleteMany({ where: { productId: id } });
      await tx.productImage.deleteMany({ where: { productId: id } });
      await tx.productVariant.deleteMany({ where: { productId: id } });

      // Delete product
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
    return NextResponse.json(
      { error: "Failed to delete product: " + (err as Error)?.message },
      { status: 500 }
    );
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
