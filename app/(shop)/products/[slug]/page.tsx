import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import ProductCard from "@/components/products/ProductCard";
import ProductDetailClient from "@/components/products/ProductDetailClient";

export const revalidate = 30;

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const product = await prisma.product.findFirst({
    where: { slug, status: "ACTIVE" },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      variants: { where: { isActive: true }, orderBy: [{ colour: "asc" }, { size: "asc" }] },
      category: { include: { parent: true } },
    },
  });

  if (!product) notFound();

  const related = await prisma.product.findMany({
    where: { categoryId: product.categoryId, status: "ACTIVE", id: { not: product.id } },
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
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-dim mb-8">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        <Link href="/shop" className="hover:text-primary transition-colors">Shop</Link>
        <span>/</span>
        {product.category.parent && (
          <>
            <Link href={`/shop?category=${product.category.parent.slug}`} className="hover:text-primary transition-colors">
              {product.category.parent.name}
            </Link>
            <span>/</span>
          </>
        )}
        <Link href={`/shop?category=${product.category.slug}`} className="hover:text-primary transition-colors">
          {product.category.name}
        </Link>
        <span>/</span>
        <span className="font-semibold text-primary truncate max-w-xs">{product.name}</span>
      </nav>

      <ProductDetailClient product={serialized} />

      {relatedSerialized.length > 0 && (
        <section className="mt-20 border-t pt-12" style={{ borderColor: "var(--fc-border)" }}>
          <div className="flex items-baseline justify-between mb-8">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold">Complete Your Look</h2>
              <p className="text-xs text-dim mt-1">Recommended styles in {product.category.name}</p>
            </div>
            <Link href={`/shop?category=${product.category.slug}`} className="text-xs font-bold text-primary hover:underline">
              View All In {product.category.name} →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {relatedSerialized.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
