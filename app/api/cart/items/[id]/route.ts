import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { z } from "zod";

const updateSchema = z.object({ quantity: z.number().int().positive().max(20) });

async function assertOwnership(userId: string, itemId: string) {
  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { cart: true, variant: true },
  });
  if (!item || item.cart.userId !== userId) return null;
  return item;
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

  const item = await assertOwnership(user.id, id);
  if (!item) return NextResponse.json({ error: "Cart item not found" }, { status: 404 });

  if (parsed.data.quantity > item.variant.stockQuantity) {
    return NextResponse.json(
      { error: `Only ${item.variant.stockQuantity} left in stock.` },
      { status: 400 }
    );
  }

  const updated = await prisma.cartItem.update({
    where: { id },
    data: { quantity: parsed.data.quantity },
  });

  return NextResponse.json({ item: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const item = await assertOwnership(user.id, id);
  if (!item) return NextResponse.json({ error: "Cart item not found" }, { status: 404 });

  await prisma.cartItem.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
