import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUser, getStoreUser } from "@/lib/auth/session";
import { z } from "zod";

const addSchema = z.object({ productId: z.string().min(1), variantId: z.string().optional() });

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [garmentsWishlist, jewelleryWishlist] = await Promise.all([
    getDb("garments").wishlist.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            product: { include: { images: { take: 1, orderBy: { sortOrder: "asc" } }, variants: true } },
          },
        },
      },
    }).catch(() => null),
    getDb("jewellery").wishlist.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            product: { include: { images: { take: 1, orderBy: { sortOrder: "asc" } }, variants: true } },
          },
        },
      },
    }).catch(() => null),
  ]);

  const garmentsItems = garmentsWishlist?.items || [];
  const jewelleryItems = jewelleryWishlist?.items || [];
  const allItems = [...garmentsItems, ...jewelleryItems];

  return NextResponse.json({
    wishlist: {
      id: garmentsWishlist?.id || jewelleryWishlist?.id || `wishlist-${user.id}`,
      userId: user.id,
      items: allItems,
    },
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = addSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  // 1. Determine if product is in Garments or Jewellery database
  let store: "garments" | "jewellery" = "garments";
  let product = await getDb("garments").product.findUnique({
    where: { id: parsed.data.productId },
  });

  if (!product) {
    product = await getDb("jewellery").product.findUnique({
      where: { id: parsed.data.productId },
    });
    if (product) {
      store = "jewellery";
    }
  }

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  // Sync user record to target store DB
  const targetUser = await getStoreUser(store);
  if (!targetUser) {
    return NextResponse.json({ error: "User session sync failed" }, { status: 500 });
  }

  const db = getDb(store);
  const wishlist = await db.wishlist.upsert({
    where: { userId: targetUser.id },
    update: {},
    create: { userId: targetUser.id },
  });

  const existingItem = await db.wishlistItem.findFirst({
    where: {
      wishlistId: wishlist.id,
      productId: parsed.data.productId,
      variantId: parsed.data.variantId ?? null,
    },
  });

  if (existingItem) {
    return NextResponse.json({ item: existingItem }, { status: 200 });
  }

  const item = await db.wishlistItem.create({
    data: {
      wishlistId: wishlist.id,
      productId: parsed.data.productId,
      variantId: parsed.data.variantId ?? null,
    },
  });

  return NextResponse.json({ item }, { status: 201 });
}
