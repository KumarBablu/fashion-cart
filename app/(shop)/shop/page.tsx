import { redirect } from "next/navigation";
import { getStoresControl } from "@/lib/stores";
import { getCachedFilterFacets, getCachedShopProducts } from "@/lib/data/cache";
import ProductCard from "@/components/products/ProductCard";
import ShopFilters from "@/components/products/ShopFilters";
import Link from "next/link";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import ScrollReveal, { ScrollRevealGroup } from "@/components/ui/ScrollReveal";

export const revalidate = 60;

const PAGE_SIZE = 24;

type SearchParams = Record<string, string | undefined>;

export default async function ShopPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const store = sp.store === "jewellery" ? "jewellery" : "garments";
  
  const storesControl = await getStoresControl();
  if (store === "jewellery" && !storesControl.jewellery.isActive) {
    redirect("/shop?store=garments");
  }
  if (store === "garments" && !storesControl.garments.isActive) {
    redirect("/shop?store=jewellery");
  }

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

  const [catalogData, facets] = await Promise.all([
    getCachedShopProducts({
      store,
      categorySlug,
      q,
      minPrice,
      maxPrice,
      size,
      colour,
      inStock,
      onSale,
      sort,
      page,
      pageSize: PAGE_SIZE,
    }),
    getCachedFilterFacets(store),
  ]);

  const { items, total } = catalogData;

  const categories = facets.categories;
  const allSizes = facets.sizes.map((s) => ({ size: s }));
  const allColours = facets.colours.map((c) => ({ colour: c }));

  let products = items.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    fabric: p.fabric,
    status: p.status,
    createdAt: typeof p.createdAt === "string" ? p.createdAt : p.createdAt?.toISOString?.() || String(p.createdAt || ""),
    averageRating: Number(p.averageRating || 4.8),
    totalReviews: Number(p.totalReviews || 12),
    images: (p.images || []).map((img: any) => ({
      imageUrl: img.imageUrl,
      altText: img.altText,
    })),
    variants: (p.variants || []).map((v: any) => ({
      id: v.id,
      colour: v.colour,
      size: v.size,
      price: Number(v.price),
      compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
      discountPercent: v.discountPercent ? Number(v.discountPercent) : null,
      stockQuantity: Number(v.stockQuantity),
    })),
  }));

  if (sort === "price_asc" || sort === "price_desc") {
    products = [...products].sort((a: any, b: any) => {
      const pa = Math.min(...a.variants.map((v: any) => v.price));
      const pb = Math.min(...b.variants.map((v: any) => v.price));
      return sort === "price_asc" ? pa - pb : pb - pa;
    });
  } else if (sort === "discount") {
    products = [...products].sort((a: any, b: any) => {
      const da = Math.max(0, ...a.variants.map((v: any) => (v.compareAtPrice ? v.compareAtPrice - v.price : 0)));
      const db = Math.max(0, ...b.variants.map((v: any) => (v.compareAtPrice ? v.compareAtPrice - v.price : 0)));
      return db - da;
    });
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const isJewellery = store === "jewellery";

  return (
    <div className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 ${isJewellery ? "theme-jewellery" : "theme-garments"}`}>
      {/* Luxury Breadcrumbs Navigation Trail */}
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: isJewellery ? "Jewellery" : "Garments", href: isJewellery ? "/jewellery" : "/garments" },
          { label: "Shop", href: isJewellery ? "/shop?store=jewellery" : "/shop" },
          ...(categorySlug
            ? [{ label: categories.find((c) => c.slug === categorySlug)?.name ?? "Category" }]
            : q
            ? [{ label: `Search: "${q}"` }]
            : onSale
            ? [{ label: "Special Offers" }]
            : [{ label: isJewellery ? "Jewellery Collection" : "All Collections" }]),
        ]}
      />

      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-6 border-b" style={{ borderColor: "var(--fc-border)" }}>
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold">
            {categorySlug
              ? categories.find((c) => c.slug === categorySlug)?.name ?? "Catalog"
              : q
              ? `Results for "${q}"`
              : isJewellery
              ? "All Fine & Artificial Jewellery"
              : "All Apparel & Fashion"}
          </h1>
          <p className="text-xs text-dim mt-1">
            {isJewellery
              ? "Handcrafted 24K micron gold plated Kundan, Temple jhumkas, Bridal chokers & CZ Solitaires"
              : "Curated luxury apparel, certified pure fabrics & new season drops"}
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
              <div className="text-4xl">{isJewellery ? "💎" : "🔍"}</div>
              <h3 className="font-display text-lg font-bold">No Products Found</h3>
              <p className="text-xs text-dim max-w-xs mx-auto">
                We couldn&apos;t find any items matching your selected criteria. Try clearing some filters.
              </p>
              <Link
                href={isJewellery ? "/shop?store=jewellery" : "/shop"}
                className="inline-block px-5 py-2.5 rounded-full text-xs font-bold text-white transition-opacity hover:opacity-90 mt-2"
                style={{ backgroundColor: "var(--fc-primary)" }}
              >
                Clear All Filters
              </Link>
            </div>
          ) : (
            <ScrollRevealGroup className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6" staggerMs={60} distance={36}>
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </ScrollRevealGroup>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-10">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                const queryObj = { ...sp, page: String(p) };
                const qs = new URLSearchParams(queryObj as any).toString();
                const isActive = p === page;

                return (
                  <Link
                    key={p}
                    href={`/shop?${qs}`}
                    prefetch={true}
                    className={`w-9 h-9 flex items-center justify-center rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                      isActive
                        ? "text-white shadow-sm"
                        : "border text-dim hover:border-black"
                    }`}
                    style={
                      isActive
                        ? { backgroundColor: "var(--fc-primary)" }
                        : { backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }
                    }
                  >
                    {p}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
