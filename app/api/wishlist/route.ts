import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUser, getStoreUser } from "@/lib/auth/session";
import { z } from "zod";

const addSchema = z.object({ productId: z.string().min(1), variantId: z.string().optional() });

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const wishlistSelect = {
    id: true,
    userId: true,
    items: {
      select: {
        id: true,
        wishlistId: true,
        productId: true,
        variantId: true,
        createdAt: true,
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            brand: true,
            fabric: true,
            status: true,
            images: {
              take: 1,
              orderBy: { sortOrder: "asc" as const },
              select: { id: true, imageUrl: true, altText: true },
            },
            variants: {
              where: { isActive: true },
              select: {
                id: true,
                colour: true,
                size: true,
                price: true,
                compareAtPrice: true,
                stockQuantity: true,
              },
            },
          },
        },
      },
    },
  };

  const [garmentsWishlist, jewelleryWishlist] = await Promise.all([
    getDb("garments").wishlist.findFirst({
      where: { user: { email: user.email } },
      select: wishlistSelect,
    }).catch(() => null),
    getDb("jewellery").wishlist.findFirst({
      where: { user: { email: user.email } },
      select: wishlistSelect,
    }).catch(() => null),
  ]);

  const garmentsItems = (garmentsWishlist?.items || []).map((item) => ({
    ...item,
    store: "garments" as const,
  }));
  const jewelleryItems = (jewelleryWishlist?.items || []).map((item) => ({
    ...item,
    store: "jewellery" as const,
  }));
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

  // 1. Locate product in parallel across stores
  const [garmentsProduct, jewelleryProduct] = await Promise.all([
    getDb("garments").product.findUnique({
      where: { id: parsed.data.productId },
      select: { id: true },
    }).catch(() => null),
    getDb("jewellery").product.findUnique({
      where: { id: parsed.data.productId },
      select: { id: true },
    }).catch(() => null),
  ]);

  let store: "garments" | "jewellery" = "garments";
  if (garmentsProduct) {
    store = "garments";
  } else if (jewelleryProduct) {
    store = "jewellery";
  } else {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  // Sync user record to target store DB if jewellery
  const targetUser = store === "garments" ? user : await getStoreUser(store, req);
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
