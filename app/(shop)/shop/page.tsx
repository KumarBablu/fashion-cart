import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import ProductCard from "@/components/products/ProductCard";
import ShopFilters from "@/components/products/ShopFilters";
import Link from "next/link";
import Breadcrumbs from "@/components/ui/Breadcrumbs";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;

type SearchParams = Record<string, string | undefined>;

export default async function ShopPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const q = sp.q?.trim();
  const categorySlug = sp.subcategory ?? sp.category;
  const minPrice = sp.minPrice ? Number(sp.minPrice) : undefined;
  const maxPrice = sp.maxPrice ? Number(sp.maxPrice) : undefined;
  const size = sp.size;
  const colour = sp.colour;
  const inStock = sp.inStock === "true";
  const onSale = sp.onSale === "true";
  const sort = sp.sort ?? "newest";
  const page = Math.max(1, Number(sp.page ?? 1));

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

  const [items, total, categories, allSizes, allColours] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        images: { take: 2, orderBy: { sortOrder: "asc" } },
        variants: { where: { isActive: true } },
      },
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({
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
    prisma.productVariant.findMany({
      where: { isActive: true },
      distinct: ["size"],
      select: { size: true },
      take: 20,
    }),
    prisma.productVariant.findMany({
      where: { isActive: true },
      distinct: ["colour"],
      select: { colour: true },
      take: 20,
    }),
  ]);

  let products = items.map((p) => ({
    ...p,
    averageRating: Number(p.averageRating || 4.8),
    totalReviews: Number(p.totalReviews || 12),
    variants: p.variants.map((v) => ({
      ...v,
      price: Number(v.price),
      compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
    })),
  }));

  if (sort === "price_asc" || sort === "price_desc") {
    products = [...products].sort((a, b) => {
      const pa = Math.min(...a.variants.map((v) => v.price));
      const pb = Math.min(...b.variants.map((v) => v.price));
      return sort === "price_asc" ? pa - pb : pb - pa;
    });
  } else if (sort === "discount") {
    products = [...products].sort((a, b) => {
      const da = Math.max(0, ...a.variants.map((v) => (v.compareAtPrice ? v.compareAtPrice - v.price : 0)));
      const db = Math.max(0, ...b.variants.map((v) => (v.compareAtPrice ? v.compareAtPrice - v.price : 0)));
      return db - da;
    });
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Luxury Breadcrumbs Navigation Trail */}
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Shop", href: "/shop" },
          ...(categorySlug
            ? [{ label: categories.find((c) => c.slug === categorySlug)?.name ?? "Category" }]
            : q
            ? [{ label: `Search: "${q}"` }]
            : onSale
            ? [{ label: "Special Offers" }]
            : [{ label: "All Collections" }]),
        ]}
      />

      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-6 border-b" style={{ borderColor: "var(--fc-border)" }}>
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold">
            {categorySlug ? categories.find((c) => c.slug === categorySlug)?.name ?? "Catalog" : q ? `Results for "${q}"` : "All Apparel & Fashion"}
          </h1>
          <p className="text-xs text-dim mt-1">
            Curated luxury apparel, certified pure fabrics &amp; new season drops
          </p>
        </div>

        {/* Sorting Dropdown */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-dim font-medium">Sort By:</span>
          <form method="GET" className="inline-block">
            {Object.entries(sp).map(([k, v]) => k !== "sort" && v && (
              <input key={k} type="hidden" name={k} value={v} />
            ))}
            <select
              name="sort"
              defaultValue={sort}
              className="px-3 py-1.5 rounded-xl border text-xs font-semibold outline-none cursor-pointer"
              style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}
            >
              <option value="newest">Newest Drops</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="discount">Biggest Discounts</option>
            </select>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
        <ShopFilters
          categories={categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug, parentId: c.parentId }))}
          sizes={allSizes.map((s) => s.size)}
          colours={allColours.map((c) => c.colour)}
        />

        <div>
          {products.length === 0 ? (
            <div
              className="rounded-3xl border p-16 text-center space-y-3"
              style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}
            >
              <div className="text-4xl">🔍</div>
              <h3 className="font-display text-lg font-bold">No Products Found</h3>
              <p className="text-xs text-dim max-w-xs mx-auto">
                We couldn&apos;t find any items matching your selected criteria. Try clearing some filters.
              </p>
              <Link
                href="/shop"
                className="inline-block px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider text-white"
                style={{ backgroundColor: "var(--fc-primary)" }}
              >
                Clear All Filters
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-12 flex justify-center gap-2 text-xs">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={`/shop?${new URLSearchParams({ ...sp, page: String(p) } as Record<string, string>).toString()}`}
                  className={`h-9 w-9 flex items-center justify-center rounded-xl font-bold border transition-all ${
                    p === page
                      ? "text-white shadow-md"
                      : "hover:border-primary"
                  }`}
                  style={{
                    backgroundColor: p === page ? "var(--fc-primary)" : "var(--fc-surface)",
                    borderColor: p === page ? "var(--fc-primary)" : "var(--fc-border)",
                  }}
                >
                  {p}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
