import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { z } from "zod";

const updateSchema = z.object({ quantity: z.number().int().positive().max(20) });

async function assertOwnership(userId: string, itemId: string) {
  // Check garments database
  const garmentsDb = getDb("garments");
  const garmentsItem = await garmentsDb.cartItem.findUnique({
    where: { id: itemId },
    include: { cart: true, variant: true },
  });

  if (garmentsItem && garmentsItem.cart.userId === userId) {
    return { item: garmentsItem, store: "garments" as const };
  }

  // Check jewellery database
  const jewelleryDb = getDb("jewellery");
  const jewelleryItem = await jewelleryDb.cartItem.findUnique({
    where: { id: itemId },
    include: { cart: true, variant: true },
  });

  if (jewelleryItem && jewelleryItem.cart.userId === userId) {
    return { item: jewelleryItem, store: "jewellery" as const };
  }

  return null;
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const result = await assertOwnership(user.id, id);
  if (!result) return NextResponse.json({ error: "Cart item not found" }, { status: 404 });

  const { item, store } = result;

  if (parsed.data.quantity > item.variant.stockQuantity) {
    return NextResponse.json(
      { error: `Only ${item.variant.stockQuantity} left in stock.` },
      { status: 400 }
    );
  }

  const db = getDb(store);
  const updated = await db.cartItem.update({
    where: { id },
    data: { quantity: parsed.data.quantity },
  });

  return NextResponse.json({ item: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const result = await assertOwnership(user.id, id);
  if (!result) return NextResponse.json({ error: "Cart item not found" }, { status: 404 });

  const db = getDb(result.store);
  await db.cartItem.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
