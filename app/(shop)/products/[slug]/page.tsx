import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth/session";
import ProductCard from "@/components/products/ProductCard";
import ProductDetailClient from "@/components/products/ProductDetailClient";
import Breadcrumbs from "@/components/ui/Breadcrumbs";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findFirst({
    where: { slug },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      category: true,
    },
  });

  if (!product) {
    return {
      title: "Product Not Found | Fashion Cart",
    };
  }

  const primaryImage = product.images[0]?.imageUrl || "/og-image.png";

  return {
    title: `${product.name} | Fashion Cart Luxury Atelier`,
    description: product.description || `Discover ${product.name} mastercrafted with certified fabrics at Fashion Cart.`,
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
  const admin = await getCurrentAdmin();

  // Find product by slug
  const product = await prisma.product.findFirst({
    where: { slug },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      variants: { where: { isActive: true }, orderBy: [{ colour: "asc" }, { size: "asc" }] },
      category: { include: { parent: true } },
    },
  });

  if (!product) notFound();

  // Check if product or its category/department is hidden
  const isCategoryHidden = !product.category?.isActive || (product.category?.parent && !product.category.parent.isActive);
  const isProductHidden = product.status !== "ACTIVE" || isCategoryHidden;

  // Regular public customers cannot view hidden products; logged-in admins can preview anything
  if (isProductHidden && !admin) {
    notFound();
  }

  const related = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      status: "ACTIVE",
      id: { not: product.id },
      category: {
        isActive: true,
        OR: [
          { parentId: null },
          { parent: { isActive: true } },
        ],
      },
    },
    take: 4,
    include: { images: { take: 2, orderBy: { sortOrder: "asc" } }, variants: { where: { isActive: true } } },
  });

  const serialized = {
    ...product,
    averageRating: Number(product.averageRating || 4.8),
    totalReviews: product.totalReviews || 12,
    variants: product.variants.map((v) => ({
      ...v,
      price: Number(v.price),
      compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
    })),
  };

  const relatedSerialized = related.map((p) => ({
    ...p,
    averageRating: Number(p.averageRating || 4.8),
    totalReviews: p.totalReviews || 12,
    variants: p.variants.map((v) => ({
      ...v,
      price: Number(v.price),
      compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
    })),
  }));

  return (
    <div>
      {/* Admin Preview Floating Header */}
      {isProductHidden && admin && (
        <div className="sticky top-16 z-30 bg-amber-500 text-slate-950 px-4 py-2.5 shadow-md flex flex-wrap items-center justify-between gap-3 text-xs font-bold border-b border-amber-600">
          <div className="flex items-center gap-2">
            <span className="text-base">🛡️</span>
            <span>
              <strong>ADMIN PREVIEW MODE:</strong> This item is currently hidden from public customers (
              {isCategoryHidden
                ? `Department "${product.category?.parent?.name || product.category?.name}" is set to Hidden`
                : `Product status is ${product.status}`}
              ).
            </span>
          </div>
          <Link
            href={`/admin/products/${product.id}`}
            className="px-3 py-1 bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors shadow-xs"
          >
            Edit in Admin Console →
          </Link>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-12 sm:space-y-16">
        {/* Luxury Breadcrumb Navigation Trail */}
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Shop", href: "/shop" },
            ...(product.category?.parent
              ? [{ label: product.category.parent.name, href: `/shop?category=${product.category.parent.slug}` }]
              : []),
            ...(product.category
              ? [{ label: product.category.name, href: `/shop?category=${product.category.slug}` }]
              : []),
            { label: product.name },
          ]}
        />

        {/* Client Product Interactive Container */}
        <ProductDetailClient product={serialized as any} />

        {/* Related Products Rail */}
        {relatedSerialized.length > 0 && (
          <section className="space-y-6 pt-12 border-t border-[#E7DFD5]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold tracking-tight text-[#141416]">
                  Complete The Ensemble
                </h2>
                <p className="text-xs text-[#787C87] mt-0.5">
                  Hand-selected pieces that complement this couture garment
                </p>
              </div>
              <Link
                href="/shop"
                className="text-xs font-bold text-[#141416] hover:text-[#C59B27] hover:underline"
              >
                View Full Collection →
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {relatedSerialized.map((p) => (
                <ProductCard key={p.id} product={p as any} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
