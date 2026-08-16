import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth/session";
import { variantSchema } from "@/lib/validation/schemas";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { variantId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = variantSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const current = await prisma.productVariant.findUnique({ where: { id: variantId } });
  if (!current) return NextResponse.json({ error: "Variant not found" }, { status: 404 });

  const { stockQuantity, ...rest } = parsed.data;

  const variant = await prisma.$transaction(async (tx) => {
    const updated = await tx.productVariant.update({
      where: { id: variantId },
      data: rest,
    });

    // Log any manual stock adjustment as an explicit, auditable transaction
    // rather than silently overwriting the quantity.
    if (stockQuantity !== undefined && stockQuantity !== current.stockQuantity) {
      const delta = stockQuantity - current.stockQuantity;
      await tx.productVariant.update({
        where: { id: variantId },
        data: { stockQuantity },
      });
      await tx.inventoryTransaction.create({
        data: {
          variantId,
          type: "ADJUSTMENT",
          quantity: delta,
          notes: `Manual admin adjustment from ${current.stockQuantity} to ${stockQuantity}`,
        },
      });
    }

    return updated;
  });

  return NextResponse.json({ variant });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ variantId: string }> }
) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { variantId } = await params;
  const variant = await prisma.productVariant.update({
    where: { id: variantId },
    data: { isActive: false },
  });
  return NextResponse.json({ variant });
}
