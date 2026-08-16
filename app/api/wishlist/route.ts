import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { z } from "zod";

const addSchema = z.object({ productId: z.string().min(1), variantId: z.string().optional() });

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const wishlist = await prisma.wishlist.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
    include: {
      items: {
        include: {
          product: { include: { images: { take: 1, orderBy: { sortOrder: "asc" } }, variants: true } },
        },
      },
    },
  });

  return NextResponse.json({ wishlist });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = addSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const wishlist = await prisma.wishlist.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });

  const existingItem = await prisma.wishlistItem.findFirst({
    where: {
      wishlistId: wishlist.id,
      productId: parsed.data.productId,
      variantId: parsed.data.variantId ?? null,
    },
  });

  if (existingItem) {
    return NextResponse.json({ item: existingItem }, { status: 200 });
  }

  const item = await prisma.wishlistItem.create({
    data: {
      wishlistId: wishlist.id,
      productId: parsed.data.productId,
      variantId: parsed.data.variantId ?? null,
    },
  });

  return NextResponse.json({ item }, { status: 201 });
}
