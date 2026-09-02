import { cache } from "react";
import { unstable_cache } from "next/cache";
import { getDb, prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

export type StoreControl = {
  id: "garments" | "jewellery";
  name: string;
  isActive: boolean;
  closedMessage: string;
};

export type AllStoresControl = {
  garments: StoreControl;
  jewellery: StoreControl;
};

export const DEFAULT_STORES_CONTROL: AllStoresControl = {
  garments: {
    id: "garments",
    name: "Atelier Haute Couture Garments",
    isActive: true,
    closedMessage: "Our Garments Boutique is temporarily undergoing catalog maintenance. We will reopen shortly!",
  },
  jewellery: {
    id: "jewellery",
    name: "Imperial Fine & Artificial Jewellery",
    isActive: true,
    closedMessage: "Our Imperial Jewellery Maison is temporarily closed for inventory curation. Please check back shortly!",
  },
};

// ============================================================================
// L1 FAST IN-MEMORY LRU & TTL CACHE (Microsecond In-Process Retrieval)
// ============================================================================

type MemoryCacheEntry<T> = {
  data: T;
  expiresAt: number;
};

const memoryCache = new Map<string, MemoryCacheEntry<any>>();

function getFromMemory<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setToMemory<T>(key: string, data: T, ttlMs: number): T {
  if (memoryCache.size > 1200) {
    const firstKey = memoryCache.keys().next().value;
    if (firstKey) memoryCache.delete(firstKey);
  }
  memoryCache.set(key, { data, expiresAt: Date.now() + ttlMs });
  return data;
}

export function clearMemoryCache(pattern?: string) {
  if (!pattern) {
    memoryCache.clear();
    return;
  }
  for (const key of memoryCache.keys()) {
    if (key.includes(pattern)) {
      memoryCache.delete(key);
    }
  }
}

// ============================================================================
// 1. STORE CONTROLS CACHING (L1 Memory + L2 Next.js ISR)
// ============================================================================

const fetchStoresControl = unstable_cache(
  async (): Promise<AllStoresControl> => {
    try {
      const [garmentsCounter, jewelleryCounter] = await Promise.all([
        prisma.counter.findUnique({ where: { id: "store-control-garments" } }),
        prisma.counter.findUnique({ where: { id: "store-control-jewellery" } }),
      ]);

      const isGarmentsActive = garmentsCounter ? garmentsCounter.value !== 0 : DEFAULT_STORES_CONTROL.garments.isActive;
      const isJewelleryActive = jewelleryCounter ? jewelleryCounter.value !== 0 : DEFAULT_STORES_CONTROL.jewellery.isActive;

      return {
        garments: {
          ...DEFAULT_STORES_CONTROL.garments,
          isActive: isGarmentsActive,
        },
        jewellery: {
          ...DEFAULT_STORES_CONTROL.jewellery,
          isActive: isJewelleryActive,
        },
      };
    } catch (err) {
      console.warn("[getCachedStoresControl] fallback to default:", err);
      return DEFAULT_STORES_CONTROL;
    }
  },
  ["stores-control"],
  { revalidate: 300, tags: ["stores-control"] }
);

export async function getCachedStoresControl(): Promise<AllStoresControl> {
  const memKey = "stores_control";
  const cached = getFromMemory<AllStoresControl>(memKey);
  if (cached) return cached;

  const result = await fetchStoresControl();
  return setToMemory(memKey, result, 120_000); // 2 min L1 cache
}

// ============================================================================
// 2. CATEGORIES HIERARCHY CACHING
// ============================================================================

const fetchCategoriesGarments = unstable_cache(
  async () => {
    const db = getDb("garments");
    return db.category.findMany({
      where: {
        isActive: true,
        parentId: null,
        OR: [
          { products: { some: { status: "ACTIVE" } } },
          { children: { some: { isActive: true, products: { some: { status: "ACTIVE" } } } } },
        ],
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        children: {
          where: {
            isActive: true,
            products: { some: { status: "ACTIVE" } },
          },
          select: { id: true, name: true, slug: true, imageUrl: true },
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        },
      },
    });
  },
  ["categories-tree-garments"],
  { revalidate: 600, tags: ["categories", "categories-garments"] }
);

const fetchCategoriesJewellery = unstable_cache(
  async () => {
    const db = getDb("jewellery");
    return db.category.findMany({
      where: {
        isActive: true,
        parentId: null,
        OR: [
          { products: { some: { status: "ACTIVE" } } },
          { children: { some: { isActive: true, products: { some: { status: "ACTIVE" } } } } },
        ],
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        children: {
          where: {
            isActive: true,
            products: { some: { status: "ACTIVE" } },
          },
          select: { id: true, name: true, slug: true, imageUrl: true },
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        },
      },
    });
  },
  ["categories-tree-jewellery"],
  { revalidate: 600, tags: ["categories", "categories-jewellery"] }
);

export async function getCachedCategories(store: string = "garments"): Promise<any[]> {
  const normalized = store === "jewellery" ? "jewellery" : "garments";
  const memKey = `categories_${normalized}`;
  const cached = getFromMemory<any[]>(memKey);
  if (cached) return cached;

  const result =
    normalized === "jewellery"
      ? await fetchCategoriesJewellery()
      : await fetchCategoriesGarments();

  return setToMemory(memKey, result, 300_000); // 5 min L1 cache
}

// ============================================================================
// 3. CATALOG FILTER FACETS CACHING (Sizes, Colours)
// ============================================================================

export type FacetsResult = {
  sizes: string[];
  colours: string[];
  categories: any[];
};

const fetchFacetsGarments = unstable_cache(
  async (): Promise<FacetsResult> => {
    const db = getDb("garments");
    const [sizes, colours, categories] = await Promise.all([
      db.productVariant.findMany({
        where: { isActive: true },
        distinct: ["size"],
        select: { size: true },
        take: 30,
      }),
      db.productVariant.findMany({
        where: { isActive: true },
        distinct: ["colour"],
        select: { colour: true },
        take: 30,
      }),
      db.category.findMany({
        where: {
          isActive: true,
          OR: [
            { products: { some: { status: "ACTIVE" } } },
            { children: { some: { isActive: true, products: { some: { status: "ACTIVE" } } } } },
          ],
        },
        select: { id: true, name: true, slug: true, parentId: true },
        orderBy: { sortOrder: "asc" },
      }),
    ]);
    return { sizes: sizes.map((s) => s.size), colours: colours.map((c) => c.colour), categories };
  },
  ["filter-facets-garments"],
  { revalidate: 600, tags: ["facets", "facets-garments"] }
);

const fetchFacetsJewellery = unstable_cache(
  async (): Promise<FacetsResult> => {
    const db = getDb("jewellery");
    const [sizes, colours, categories] = await Promise.all([
      db.productVariant.findMany({
        where: { isActive: true },
        distinct: ["size"],
        select: { size: true },
        take: 30,
      }),
      db.productVariant.findMany({
        where: { isActive: true },
        distinct: ["colour"],
        select: { colour: true },
        take: 30,
      }),
      db.category.findMany({
        where: {
          isActive: true,
          OR: [
            { products: { some: { status: "ACTIVE" } } },
            { children: { some: { isActive: true, products: { some: { status: "ACTIVE" } } } } },
          ],
        },
        select: { id: true, name: true, slug: true, parentId: true },
        orderBy: { sortOrder: "asc" },
      }),
    ]);
    return { sizes: sizes.map((s) => s.size), colours: colours.map((c) => c.colour), categories };
  },
  ["filter-facets-jewellery"],
  { revalidate: 600, tags: ["facets", "facets-jewellery"] }
);

export async function getCachedFilterFacets(store: string = "garments"): Promise<FacetsResult> {
  const normalized = store === "jewellery" ? "jewellery" : "garments";
  const memKey = `facets_${normalized}`;
  const cached = getFromMemory<FacetsResult>(memKey);
  if (cached) return cached;

  const result =
    normalized === "jewellery"
      ? await fetchFacetsJewellery()
      : await fetchFacetsGarments();

  return setToMemory(memKey, result, 300_000); // 5 min L1 cache
}

// ============================================================================
// 4. BANNERS & PROMOTIONS CACHING
// ============================================================================

const fetchBannersGarments = unstable_cache(
  async () => getDb("garments").banner.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
  ["banners-garments"],
  { revalidate: 300, tags: ["banners", "banners-garments"] }
);

const fetchBannersJewellery = unstable_cache(
  async () => getDb("jewellery").banner.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
  ["banners-jewellery"],
  { revalidate: 300, tags: ["banners", "banners-jewellery"] }
);

export async function getCachedBanners(store: string = "garments"): Promise<any[]> {
  const normalized = store === "jewellery" ? "jewellery" : "garments";
  const memKey = `banners_${normalized}`;
  const cached = getFromMemory<any[]>(memKey);
  if (cached) return cached;

  const result = normalized === "jewellery" ? await fetchBannersJewellery() : await fetchBannersGarments();
  return setToMemory(memKey, result, 180_000);
}

const fetchPromotionsGarments = unstable_cache(
  async () => getDb("garments").promotion.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
  ["promotions-garments"],
  { revalidate: 300, tags: ["promotions", "promotions-garments"] }
);

const fetchPromotionsJewellery = unstable_cache(
  async () => getDb("jewellery").promotion.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
  ["promotions-jewellery"],
  { revalidate: 300, tags: ["promotions", "promotions-jewellery"] }
);

export async function getCachedPromotions(store: string = "garments"): Promise<any[]> {
  const normalized = store === "jewellery" ? "jewellery" : "garments";
  const memKey = `promotions_${normalized}`;
  const cached = getFromMemory<any[]>(memKey);
  if (cached) return cached;

  const result = normalized === "jewellery" ? await fetchPromotionsJewellery() : await fetchPromotionsGarments();
  return setToMemory(memKey, result, 180_000);
}

// ============================================================================
// 5. HOME PAGE PRODUCTS CACHING
// ============================================================================

const productCardSelect = {
  id: true,
  name: true,
  slug: true,
  brand: true,
  fabric: true,
  status: true,
  createdAt: true,
  averageRating: true,
  totalReviews: true,
  images: {
    select: { id: true, imageUrl: true, altText: true, sortOrder: true },
    orderBy: { sortOrder: "asc" as const },
    take: 2,
  },
  variants: {
    where: { isActive: true },
    select: {
      id: true,
      colour: true,
      size: true,
      price: true,
      compareAtPrice: true,
      discountPercent: true,
      stockQuantity: true,
    },
  },
  category: {
    select: { id: true, name: true, slug: true },
  },
};

const fetchHomeProductsGarments = unstable_cache(
  async () => {
    return getDb("garments").product.findMany({
      where: {
        status: "ACTIVE",
        category: {
          isActive: true,
          OR: [{ parentId: null }, { parent: { isActive: true } }],
        },
      },
      orderBy: { createdAt: "desc" },
      take: 24,
      select: productCardSelect,
    });
  },
  ["home-products-garments"],
  { revalidate: 120, tags: ["products", "products-garments"] }
);

const fetchHomeProductsJewellery = unstable_cache(
  async () => {
    return getDb("jewellery").product.findMany({
      where: {
        status: "ACTIVE",
        category: {
          isActive: true,
          OR: [{ parentId: null }, { parent: { isActive: true } }],
        },
      },
      orderBy: { createdAt: "desc" },
      take: 24,
      select: productCardSelect,
    });
  },
  ["home-products-jewellery"],
  { revalidate: 120, tags: ["products", "products-jewellery"] }
);

export async function getCachedHomeProducts(store: string = "garments"): Promise<any[]> {
  const normalized = store === "jewellery" ? "jewellery" : "garments";
  const memKey = `home_products_${normalized}`;
  const cached = getFromMemory<any[]>(memKey);
  if (cached) return cached;

  const result =
    normalized === "jewellery"
      ? await fetchHomeProductsJewellery()
      : await fetchHomeProductsGarments();

  return setToMemory(memKey, result, 120_000);
}

// ============================================================================
// 6. ULTRA-FAST SHOP CATALOG CACHING (Instant Category & Store Browsing)
// ============================================================================

export type ShopQueryOptions = {
  store: "garments" | "jewellery";
  categorySlug?: string;
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  size?: string;
  colour?: string;
  inStock?: boolean;
  onSale?: boolean;
  sort?: string;
  page?: number;
  pageSize?: number;
};

export async function getCachedShopProducts(options: ShopQueryOptions): Promise<{ items: any[]; total: number }> {
  const {
    store,
    categorySlug,
    q,
    minPrice,
    maxPrice,
    size,
    colour,
    inStock,
    onSale,
    sort = "newest",
    page = 1,
    pageSize = 24,
  } = options;

  const memKey = `shop_cat_${store}_${categorySlug || "all"}_${q || ""}_${minPrice || ""}_${maxPrice || ""}_${size || ""}_${colour || ""}_${inStock ? "1" : "0"}_${onSale ? "1" : "0"}_${sort}_${page}`;
  const cached = getFromMemory<{ items: any[]; total: number }>(memKey);
  if (cached) return cached;

  const db = getDb(store);

  const where: Prisma.ProductWhereInput = {
    status: "ACTIVE",
    category: {
      isActive: true,
      OR: [
        { parentId: null },
        { parent: { isActive: true } },
      ],
      ...(categorySlug
        ? {
            OR: [
              { slug: categorySlug },
              { parent: { slug: categorySlug, isActive: true } },
            ],
          }
        : {}),
    },
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { brand: { contains: q, mode: "insensitive" } },
            { category: { name: { contains: q, mode: "insensitive" } } },
            { variants: { some: { sku: { contains: q, mode: "insensitive" } } } },
          ],
        }
      : {}),
    variants: {
      some: {
        isActive: true,
        ...(minPrice !== undefined ? { price: { gte: minPrice } } : {}),
        ...(maxPrice !== undefined ? { price: { lte: maxPrice } } : {}),
        ...(size ? { size: { equals: size, mode: "insensitive" } } : {}),
        ...(colour ? { colour: { contains: colour, mode: "insensitive" } } : {}),
        ...(inStock ? { stockQuantity: { gt: 0 } } : {}),
        ...(onSale ? { compareAtPrice: { not: null } } : {}),
      },
    },
  };

  const orderBy =
    sort === "price-asc"
      ? { createdAt: "desc" as const }
      : sort === "price-desc"
      ? { createdAt: "desc" as const }
      : sort === "rating"
      ? { averageRating: "desc" as const }
      : { createdAt: "desc" as const };

  const [items, total] = await Promise.all([
    db.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        slug: true,
        name: true,
        brand: true,
        fabric: true,
        status: true,
        createdAt: true,
        averageRating: true,
        totalReviews: true,
        images: {
          take: 2,
          orderBy: { sortOrder: "asc" },
          select: { imageUrl: true, altText: true },
        },
        variants: {
          where: { isActive: true },
          select: {
            id: true,
            colour: true,
            size: true,
            price: true,
            compareAtPrice: true,
            discountPercent: true,
            stockQuantity: true,
          },
        },
      },
    }),
    db.product.count({ where }),
  ]);

  const result = { items, total };
  return setToMemory(memKey, result, 90_000); // 90s fast cache
}

// ============================================================================
// 7. PRODUCT DETAIL & METADATA CACHING
// ============================================================================

const fetchProductBySlug = async (slug: string, hintStore?: string) => {
  const [garmentsProduct, jewelleryProduct] = await Promise.all([
    getDb("garments").product.findFirst({
      where: { slug },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        variants: { where: { isActive: true }, orderBy: [{ colour: "asc" }, { size: "asc" }] },
        category: { include: { parent: true } },
      },
    }).catch(() => null),
    getDb("jewellery").product.findFirst({
      where: { slug },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        variants: { where: { isActive: true }, orderBy: [{ colour: "asc" }, { size: "asc" }] },
        category: { include: { parent: true } },
      },
    }).catch(() => null),
  ]);

  if (hintStore === "jewellery" && jewelleryProduct) {
    return { product: jewelleryProduct, store: "jewellery" as const };
  }
  if (garmentsProduct) {
    return { product: garmentsProduct, store: "garments" as const };
  }
  if (jewelleryProduct) {
    return { product: jewelleryProduct, store: "jewellery" as const };
  }
  return null;
};

export async function getCachedProductBySlug(slug: string, hintStore?: string): Promise<{ product: any; store: "garments" | "jewellery" } | null> {
  const memKey = `prod_slug_${slug}_${hintStore || "any"}`;
  const cached = getFromMemory<{ product: any; store: "garments" | "jewellery" } | null>(memKey);
  if (cached) return cached;

  const result = await fetchProductBySlug(slug, hintStore);
  return setToMemory(memKey, result, 180_000);
}

export const getMemoizedProductBySlug = cache(async (slug: string, hintStore?: string) => {
  return getCachedProductBySlug(slug, hintStore);
});

// ============================================================================
// 8. RELATED PRODUCTS CACHING
// ============================================================================

export async function getCachedRelatedProducts(
  categoryId: string,
  excludeProductId: string,
  store: string = "garments"
): Promise<any[]> {
  const normalized = store === "jewellery" ? "jewellery" : "garments";
  const memKey = `related_${categoryId}_${excludeProductId}_${normalized}`;
  const cached = getFromMemory<any[]>(memKey);
  if (cached) return cached;

  const db = getDb(normalized);
  const result = await db.product.findMany({
    where: {
      categoryId,
      status: "ACTIVE",
      id: { not: excludeProductId },
      category: {
        isActive: true,
        OR: [{ parentId: null }, { parent: { isActive: true } }],
      },
    },
    take: 4,
    select: {
      id: true,
      name: true,
      slug: true,
      brand: true,
      fabric: true,
      status: true,
      createdAt: true,
      averageRating: true,
      totalReviews: true,
      images: {
        select: { id: true, imageUrl: true, altText: true },
        orderBy: { sortOrder: "asc" },
        take: 2,
      },
      variants: {
        where: { isActive: true },
        select: {
          id: true,
          colour: true,
          size: true,
          price: true,
          compareAtPrice: true,
          discountPercent: true,
          stockQuantity: true,
        },
      },
    },
  });

  return setToMemory(memKey, result, 300_000);
}

// ============================================================================
// 9. DETAILED CATEGORIES DIRECTORY CACHING (for /categories)
// ============================================================================

export async function getCachedDetailedCategories(store: string = "garments"): Promise<any[]> {
  const normalized = store === "jewellery" ? "jewellery" : "garments";
  const memKey = `detailed_categories_${normalized}`;
  const cached = getFromMemory<any[]>(memKey);
  if (cached) return cached;

  const db = getDb(normalized);
  const result = await db.category.findMany({
    where: {
      isActive: true,
      parentId: null,
      OR: [
        { products: { some: { status: "ACTIVE" } } },
        { children: { some: { isActive: true, products: { some: { status: "ACTIVE" } } } } },
      ],
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      children: {
        where: {
          isActive: true,
          products: { some: { status: "ACTIVE" } },
        },
        orderBy: { sortOrder: "asc" },
        include: {
          products: {
            where: { status: "ACTIVE" },
            take: 3,
            orderBy: { createdAt: "desc" },
            include: {
              images: { take: 1, orderBy: { sortOrder: "asc" } },
              variants: { where: { isActive: true }, take: 1, orderBy: { price: "asc" } },
            },
          },
        },
      },
      products: {
        where: { status: "ACTIVE" },
        take: 3,
        orderBy: { createdAt: "desc" },
        include: {
          images: { take: 1, orderBy: { sortOrder: "asc" } },
          variants: { where: { isActive: true }, take: 1, orderBy: { price: "asc" } },
        },
      },
    },
  });

  return setToMemory(memKey, result, 300_000);
}
