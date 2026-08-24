import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getStoresControl } from "@/lib/stores";
import { getCurrentAdmin } from "@/lib/auth/session";
import {
  getMemoizedProductBySlug,
  getCachedRelatedProducts,
} from "@/lib/data/cache";
import ProductCard from "@/components/products/ProductCard";
import ProductDetailClient from "@/components/products/ProductDetailClient";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import ScrollReveal from "@/components/ui/ScrollReveal";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const result = await getMemoizedProductBySlug(slug);

  if (!result || !result.product) {
    return {
      title: "Product Not Found | Fashion Cart",
    };
  }

  const product = result.product;
  const primaryImage = product.images[0]?.imageUrl || "/og-image.png";

  return {
    title: `${product.name} | Fashion Cart Luxury Atelier`,
    description: product.description || `Discover ${product.name} mastercrafted with certified quality at Fashion Cart.`,
    openGraph: {
      title: `${product.name} | Fashion Cart Luxury Atelier`,
      description: product.description || `Discover ${product.name} at Fashion Cart.`,
      images: [
        {
          url: primaryImage,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} | Fashion Cart Luxury Atelier`,
      description: product.description || `Discover ${product.name} at Fashion Cart.`,
      images: [primaryImage],
    },
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [admin, result, storesControl] = await Promise.all([
    getCurrentAdmin(),
    getMemoizedProductBySlug(slug),
    getStoresControl(),
  ]);

  if (!result || !result.product) notFound();

  const { product, store: activeStore } = result;

  const isStoreActive = storesControl[activeStore].isActive;
  if (!isStoreActive && !admin) {
    redirect("/shop");
  }

  // Check if product or its category/department is hidden
  const isCategoryHidden = !product.category?.isActive || (product.category?.parent && !product.category.parent.isActive);
  const isProductHidden = product.status !== "ACTIVE" || isCategoryHidden;

  // Regular public customers cannot view hidden products; logged-in admins can preview anything
  if (isProductHidden && !admin) {
    notFound();
  }

  const related = await getCachedRelatedProducts(product.categoryId, product.id, activeStore);

  const serialized = {
    ...product,
    createdAt: typeof product.createdAt === "string" ? product.createdAt : product.createdAt?.toISOString?.() || String(product.createdAt || ""),
    updatedAt: typeof product.updatedAt === "string" ? product.updatedAt : product.updatedAt?.toISOString?.() || String(product.updatedAt || ""),
    averageRating: Number(product.averageRating || 4.8),
    totalReviews: Number(product.totalReviews || 12),
    variants: (product.variants || []).map((v) => ({
      ...v,
      price: Number(v.price),
      compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
      discountPercent: v.discountPercent ? Number(v.discountPercent) : null,
      stockQuantity: Number(v.stockQuantity || 0),
    })),
  };

  const relatedSerialized = (related || []).map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    fabric: p.fabric,
    status: p.status,
    createdAt: typeof p.createdAt === "string" ? p.createdAt : p.createdAt?.toISOString?.() || String(p.createdAt || ""),
    averageRating: Number(p.averageRating || 4.8),
    totalReviews: Number(p.totalReviews || 12),
    images: (p.images || []).map((img) => ({
      imageUrl: img.imageUrl,
      altText: img.altText,
    })),
    variants: (p.variants || []).map((v) => ({
      id: v.id,
      colour: v.colour,
      size: v.size,
      price: Number(v.price),
      compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
      discountPercent: v.discountPercent ? Number(v.discountPercent) : null,
      stockQuantity: Number(v.stockQuantity || 0),
    })),
  }));

  const isJewellery = activeStore === "jewellery";
  const parentCategory = product.category?.parent;
  const directCategory = product.category;

  return (
    <div className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-10 ${isJewellery ? "theme-jewellery" : "theme-garments"}`}>
      {/* Luxury Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: isJewellery ? "Jewellery" : "Garments", href: isJewellery ? "/jewellery" : "/garments" },
          { label: "Shop", href: isJewellery ? "/shop?store=jewellery" : "/shop" },
          ...(parentCategory ? [{ label: parentCategory.name, href: `/shop?store=${activeStore}&category=${parentCategory.slug}` }] : []),
          ...(directCategory ? [{ label: directCategory.name, href: `/shop?store=${activeStore}&category=${directCategory.slug}` }] : []),
          { label: product.name },
        ]}
      />

      {/* Product Detail Main Client View */}
      <ProductDetailClient product={serialized as any} isJewellery={isJewellery} />

      {/* Related Products Carousel / Grid */}
      {relatedSerialized.length > 0 && (
        <ScrollReveal direction="up" distance={28}>
          <section className="pt-10 border-t" style={{ borderColor: "var(--fc-border)" }}>
            <div className="flex items-baseline justify-between mb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-accent">✦ Complete the Look</span>
                <h2 className="font-display text-2xl font-bold mt-1">You May Also Admire</h2>
              </div>
              <Link
                href={directCategory ? `/shop?store=${activeStore}&category=${directCategory.slug}` : `/shop?store=${activeStore}`}
                prefetch={true}
                className="text-xs font-bold hover:underline"
                style={{ color: "var(--fc-accent)" }}
              >
                Explore Collection →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
              {relatedSerialized.map((p) => (
                <ProductCard key={p.id} product={p as any} />
              ))}
            </div>
          </section>
        </ScrollReveal>
      )}
    </div>
  );
}
