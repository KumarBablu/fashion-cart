import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { z } from "zod";

const addItemSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().positive().max(20),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cart = await prisma.cart.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
    include: {
      items: {
        include: {
          product: { include: { images: { take: 1, orderBy: { sortOrder: "asc" } } } },
          variant: true,
        },
      },
    },
  });

  const subtotal = cart.items.reduce(
    (sum, item) => sum + item.variant.price.toNumber() * item.quantity,
    0
  );

  return NextResponse.json({ cart, subtotal });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = addItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const variant = await prisma.productVariant.findUnique({
    where: { id: parsed.data.variantId },
    include: { product: true },
  });

  if (!variant || !variant.isActive || variant.product.status !== "ACTIVE") {
    return NextResponse.json({ error: "This product is currently unavailable." }, { status: 404 });
  }

  if (variant.stockQuantity < parsed.data.quantity) {
    return NextResponse.json(
      { error: `Only ${variant.stockQuantity} left in stock for this size/colour.` },
      { status: 400 }
    );
  }

  const cart = await prisma.cart.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });

  const existingItem = await prisma.cartItem.findUnique({
    where: { cartId_variantId: { cartId: cart.id, variantId: variant.id } },
  });

  const desiredQty = (existingItem?.quantity ?? 0) + parsed.data.quantity;
  if (desiredQty > variant.stockQuantity) {
    return NextResponse.json(
      { error: `Only ${variant.stockQuantity} left in stock for this size/colour.` },
      { status: 400 }
    );
  }

  const item = await prisma.cartItem.upsert({
    where: { cartId_variantId: { cartId: cart.id, variantId: variant.id } },
    update: { quantity: desiredQty },
    create: {
      cartId: cart.id,
      productId: variant.productId,
      variantId: variant.id,
      quantity: parsed.data.quantity,
    },
  });

  return NextResponse.json({ item }, { status: 201 });
}
