import { cache } from "react";
import { unstable_cache } from "next/cache";
import { getDb, prisma } from "@/lib/db";

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
// 1. STORE CONTROLS CACHING
// ============================================================================

export const getCachedStoresControl = unstable_cache(
  async (): Promise<AllStoresControl> => {
    try {
      const settings = await prisma.businessSettings.findFirst({
        select: { gstin: true },
      });
      if (settings && settings.gstin && settings.gstin.startsWith("STORE_CTRL:")) {
        const rawJson = settings.gstin.replace("STORE_CTRL:", "");
        const parsed = JSON.parse(rawJson);
        return {
          garments: { ...DEFAULT_STORES_CONTROL.garments, ...parsed.garments },
          jewellery: { ...DEFAULT_STORES_CONTROL.jewellery, ...parsed.jewellery },
        };
      }
    } catch (err) {
      console.warn("[getCachedStoresControl] fallback to default:", err);
    }
    return DEFAULT_STORES_CONTROL;
  },
  ["stores-control"],
  { revalidate: 300, tags: ["stores-control"] }
);

// ============================================================================
// 2. CATEGORIES HIERARCHY CACHING
// ============================================================================

export const getCachedCategories = (store: string = "garments") => {
  const normalized = store === "jewellery" ? "jewellery" : "garments";
  return unstable_cache(
    async () => {
      const db = getDb(normalized);
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
    [`categories-tree-${normalized}`],
    { revalidate: 600, tags: ["categories", `categories-${normalized}`] }
  )();
};

// ============================================================================
// 3. CATALOG FILTER FACETS CACHING (Sizes, Colours)
// ============================================================================

export const getCachedFilterFacets = (store: string = "garments") => {
  const normalized = store === "jewellery" ? "jewellery" : "garments";
  return unstable_cache(
    async () => {
      const db = getDb(normalized);
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
    [`filter-facets-${normalized}`],
    { revalidate: 600, tags: ["facets", `facets-${normalized}`] }
  )();
};

// ============================================================================
// 4. BANNERS & PROMOTIONS CACHING
// ============================================================================

export const getCachedBanners = (store: string = "garments") => {
  const normalized = store === "jewellery" ? "jewellery" : "garments";
  return unstable_cache(
    async () => {
      const db = getDb(normalized);
      return db.banner.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      });
    },
    [`banners-${normalized}`],
    { revalidate: 300, tags: ["banners", `banners-${normalized}`] }
  )();
};

export const getCachedPromotions = (store: string = "garments") => {
  const normalized = store === "jewellery" ? "jewellery" : "garments";
  return unstable_cache(
    async () => {
      const db = getDb(normalized);
      return db.promotion.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      });
    },
    [`promotions-${normalized}`],
    { revalidate: 300, tags: ["promotions", `promotions-${normalized}`] }
  )();
};

// ============================================================================
// 5. HOME PAGE PRODUCTS CACHING
// ============================================================================

export const getCachedHomeProducts = (store: string = "garments") => {
  const normalized = store === "jewellery" ? "jewellery" : "garments";
  return unstable_cache(
    async () => {
      const db = getDb(normalized);
      return db.product.findMany({
        where: {
          status: "ACTIVE",
          category: {
            isActive: true,
            OR: [{ parentId: null }, { parent: { isActive: true } }],
          },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          name: true,
          slug: true,
          brand: true,
          fabric: true,
          status: true,
          averageRating: true,
          totalReviews: true,
          images: {
            select: { id: true, imageUrl: true, altText: true, sortOrder: true },
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
          category: {
            select: { id: true, name: true, slug: true },
          },
        },
      });
    },
    [`home-products-${normalized}`],
    { revalidate: 120, tags: ["products", `products-${normalized}`] }
  )();
};

// ============================================================================
// 6. PRODUCT DETAIL & METADATA CACHING (Memoized & Cached)
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

export const getCachedProductBySlug = (slug: string, hintStore?: string) => {
  return unstable_cache(
    async () => fetchProductBySlug(slug, hintStore),
    [`product-${slug}`],
    { revalidate: 300, tags: [`product-${slug}`, "products"] }
  )();
};

// Request-level memoized version to eliminate duplicate calls between generateMetadata and Page
export const getMemoizedProductBySlug = cache(async (slug: string, hintStore?: string) => {
  return getCachedProductBySlug(slug, hintStore);
});

// ============================================================================
// 7. RELATED PRODUCTS CACHING
// ============================================================================

export const getCachedRelatedProducts = (
  categoryId: string,
  excludeProductId: string,
  store: string = "garments"
) => {
  const normalized = store === "jewellery" ? "jewellery" : "garments";
  return unstable_cache(
    async () => {
      const db = getDb(normalized);
      return db.product.findMany({
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
    },
    [`related-${categoryId}-${excludeProductId}`],
    { revalidate: 600, tags: ["products", `products-${normalized}`] }
  )();
};
