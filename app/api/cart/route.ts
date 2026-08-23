import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUser, getStoreUser } from "@/lib/auth/session";
import { z } from "zod";

const addItemSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().positive().max(20),
});

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const cookieStore = req.cookies.get("fc_store")?.value;
  const referer = req.headers.get("referer") || "";
  const refererIsJewellery = referer.includes("/jewellery") || referer.includes("store=jewellery");

  const requestedStore = sp.get("store") || (refererIsJewellery ? "jewellery" : cookieStore) || "garments";
  const store = requestedStore === "jewellery" ? "jewellery" : "garments";

  try {
    const db = getDb(store);
    const cart = await db.cart.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            product: { include: { images: { take: 1, orderBy: { sortOrder: "asc" } } } },
            variant: true,
          },
        },
      },
    });

    const items = (cart?.items || []).map((item) => ({
      ...item,
      store,
      variant: {
        ...item.variant,
        price: Number(item.variant.price),
        compareAtPrice: item.variant.compareAtPrice ? Number(item.variant.compareAtPrice) : null,
      },
    }));

    const subtotal = items.reduce(
      (sum, item) => sum + Number(item.variant.price) * item.quantity,
      0
    );

    return NextResponse.json({
      cart: {
        id: cart?.id || `cart-${store}-${user.id}`,
        userId: user.id,
        store,
        items,
      },
      subtotal,
    });
  } catch (error) {
    console.error(`Error fetching ${store} cart:`, error);
    return NextResponse.json({ error: "Failed to load cart items" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = addItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const sp = req.nextUrl.searchParams;
  const cookieStore = req.cookies.get("fc_store")?.value;
  const explicitStore = body?.store || sp.get("store") || cookieStore;

  // 1. Locate product variant in requested store DB first, then fallback to other
  let store: "garments" | "jewellery" = explicitStore === "jewellery" ? "jewellery" : "garments";
  let variant = await getDb(store).productVariant.findUnique({
    where: { id: parsed.data.variantId },
    include: { product: true },
  });

  if (!variant) {
    const otherStore = store === "jewellery" ? "garments" : "jewellery";
    const altVariant = await getDb(otherStore).productVariant.findUnique({
      where: { id: parsed.data.variantId },
      include: { product: true },
    });
    if (altVariant) {
      variant = altVariant;
      store = otherStore;
    }
  }

  if (!variant || !variant.isActive || variant.product.status !== "ACTIVE") {
    return NextResponse.json({ error: "This product is currently unavailable." }, { status: 404 });
  }

  if (variant.stockQuantity < parsed.data.quantity) {
    return NextResponse.json(
      { error: `Only ${variant.stockQuantity} left in stock for this size/colour.` },
      { status: 400 }
    );
  }

  // 2. Synchronize user SSO record to target store
  const targetUser = await getStoreUser(store, req);
  if (!targetUser) {
    return NextResponse.json({ error: "User session synchronization failed." }, { status: 500 });
  }

  const db = getDb(store);

  const cart = await db.cart.upsert({
    where: { userId: targetUser.id },
    update: {},
    create: { userId: targetUser.id },
  });

  const existingItem = await db.cartItem.findUnique({
    where: { cartId_variantId: { cartId: cart.id, variantId: variant.id } },
  });

  const desiredQty = (existingItem?.quantity ?? 0) + parsed.data.quantity;
  if (desiredQty > variant.stockQuantity) {
    return NextResponse.json(
      { error: `Only ${variant.stockQuantity} left in stock for this size/colour.` },
      { status: 400 }
    );
  }

  const item = await db.cartItem.upsert({
    where: { cartId_variantId: { cartId: cart.id, variantId: variant.id } },
    update: { quantity: desiredQty },
    create: {
      cartId: cart.id,
      productId: variant.productId,
      variantId: variant.id,
      quantity: parsed.data.quantity,
    },
  });

  return NextResponse.json({ item, store }, { status: 201 });
}
