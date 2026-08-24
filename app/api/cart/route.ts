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

  const isDirect = sp.get("direct") === "true";
  const directVariantId = sp.get("variantId");
  const directQuantity = Math.max(1, parseInt(sp.get("quantity") || "1", 10));

  if (isDirect && directVariantId) {
    let variant = await getDb(store).productVariant.findUnique({
      where: { id: directVariantId },
      select: {
        id: true,
        productId: true,
        colour: true,
        size: true,
        price: true,
        compareAtPrice: true,
        stockQuantity: true,
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            brand: true,
            fabric: true,
            images: {
              take: 1,
              orderBy: { sortOrder: "asc" },
              select: { id: true, imageUrl: true, altText: true },
            },
          },
        },
      },
    });

    if (!variant) {
      const otherStore = store === "jewellery" ? "garments" : "jewellery";
      variant = await getDb(otherStore).productVariant.findUnique({
        where: { id: directVariantId },
        select: {
          id: true,
          productId: true,
          colour: true,
          size: true,
          price: true,
          compareAtPrice: true,
          stockQuantity: true,
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              brand: true,
              fabric: true,
              images: {
                take: 1,
                orderBy: { sortOrder: "asc" },
                select: { id: true, imageUrl: true, altText: true },
              },
            },
          },
        },
      });
    }

    if (!variant) {
      return NextResponse.json({ error: "Product variant not found" }, { status: 404 });
    }

    const price = Number(variant.price);
    const item = {
      id: `direct-${variant.id}`,
      cartId: `direct-cart`,
      productId: variant.productId,
      variantId: variant.id,
      quantity: directQuantity,
      store,
      product: variant.product,
      variant: {
        ...variant,
        price,
        compareAtPrice: variant.compareAtPrice ? Number(variant.compareAtPrice) : null,
      },
    };

    return NextResponse.json({
      cart: {
        id: `direct-cart-${user.id}`,
        userId: user.id,
        store,
        isDirect: true,
        items: [item],
      },
      subtotal: price * directQuantity,
    });
  }

  const fetchAll = sp.get("all") === "true";
  if (fetchAll) {
    const itemSelect = {
      id: true,
      cartId: true,
      productId: true,
      variantId: true,
      quantity: true,
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          brand: true,
          fabric: true,
          images: {
            take: 1,
            orderBy: { sortOrder: "asc" as const },
            select: { id: true, imageUrl: true, altText: true },
          },
        },
      },
      variant: {
        select: {
          id: true,
          colour: true,
          size: true,
          price: true,
          compareAtPrice: true,
          stockQuantity: true,
        },
      },
    };

    try {
      const [garmentsCart, jewelleryCart] = await Promise.all([
        getDb("garments").cart.findUnique({
          where: { userId: user.id },
          select: { id: true, userId: true, items: { select: itemSelect } },
        }).catch(() => null),
        getDb("jewellery").cart.findUnique({
          where: { userId: user.id },
          select: { id: true, userId: true, items: { select: itemSelect } },
        }).catch(() => null),
      ]);

      const garmentsItems = (garmentsCart?.items || []).map((i) => ({
        ...i,
        store: "garments" as const,
        variant: { ...i.variant, price: Number(i.variant.price), compareAtPrice: i.variant.compareAtPrice ? Number(i.variant.compareAtPrice) : null },
      }));
      const jewelleryItems = (jewelleryCart?.items || []).map((i) => ({
        ...i,
        store: "jewellery" as const,
        variant: { ...i.variant, price: Number(i.variant.price), compareAtPrice: i.variant.compareAtPrice ? Number(i.variant.compareAtPrice) : null },
      }));

      const activeStoreItems = store === "jewellery" ? jewelleryItems : garmentsItems;
      const allItems = [...garmentsItems, ...jewelleryItems];
      const totalCount = allItems.reduce((n, i) => n + i.quantity, 0);

      return NextResponse.json({
        cart: {
          id: `cart-all-${user.id}`,
          userId: user.id,
          store,
          items: activeStoreItems,
          allItems,
        },
        totalCount,
        garmentsCount: garmentsItems.reduce((n, i) => n + i.quantity, 0),
        jewelleryCount: jewelleryItems.reduce((n, i) => n + i.quantity, 0),
        subtotal: activeStoreItems.reduce((sum, item) => sum + Number(item.variant.price) * item.quantity, 0),
      });
    } catch {
      return NextResponse.json({ error: "Failed to load carts" }, { status: 500 });
    }
  }

  try {
    const db = getDb(store);
    const cart = await db.cart.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        userId: true,
        items: {
          select: {
            id: true,
            cartId: true,
            productId: true,
            variantId: true,
            quantity: true,
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                brand: true,
                fabric: true,
                images: {
                  take: 1,
                  orderBy: { sortOrder: "asc" },
                  select: { id: true, imageUrl: true, altText: true },
                },
              },
            },
            variant: {
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

  // 1. Locate product variant with selective fields in requested store or parallel fallback
  let store: "garments" | "jewellery" = explicitStore === "jewellery" ? "jewellery" : "garments";
  let variant = await getDb(store).productVariant.findUnique({
    where: { id: parsed.data.variantId },
    select: {
      id: true,
      productId: true,
      isActive: true,
      stockQuantity: true,
      product: { select: { id: true, status: true } },
    },
  });

  if (!variant) {
    const otherStore = store === "jewellery" ? "garments" : "jewellery";
    const altVariant = await getDb(otherStore).productVariant.findUnique({
      where: { id: parsed.data.variantId },
      select: {
        id: true,
        productId: true,
        isActive: true,
        stockQuantity: true,
        product: { select: { id: true, status: true } },
      },
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
  const targetUser = store === "garments" ? user : await getStoreUser(store, req);
  if (!targetUser) {
    return NextResponse.json({ error: "User session synchronization failed." }, { status: 500 });
  }

  const db = getDb(store);

  const cart = await db.cart.upsert({
    where: { userId: targetUser.id },
    update: {},
    create: { userId: targetUser.id },
    select: { id: true },
  });

  const existingItem = await db.cartItem.findUnique({
    where: { cartId_variantId: { cartId: cart.id, variantId: variant.id } },
    select: { quantity: true },
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
