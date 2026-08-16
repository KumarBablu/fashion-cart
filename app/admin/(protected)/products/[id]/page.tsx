import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import ProductForm from "@/components/admin/ProductForm";
import VariantManager from "@/components/admin/VariantManager";
import ImageManager from "@/components/admin/ImageManager";
import ArchiveProductButton from "@/components/admin/ArchiveProductButton";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: { variants: { orderBy: [{ colour: "asc" }, { size: "asc" }] }, images: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  if (!product) notFound();

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl">Edit Product</h1>
        <ArchiveProductButton slug={product.slug} archived={product.status === "ARCHIVED"} />
      </div>

      <div className="mt-6">
        <ProductForm
          categories={categories.map((c) => ({ id: c.id, name: c.name }))}
          existing={{
            id: product.id,
            name: product.name,
            slug: product.slug,
            description: product.description,
            categoryId: product.categoryId,
            brand: product.brand,
            fabric: product.fabric,
            status: product.status,
            isFeatured: product.isFeatured,
            isNewArrival: product.isNewArrival,
            isBestSeller: product.isBestSeller,
          }}
        />
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft mb-3">Variants &amp; Stock</h2>
        <VariantManager
          productId={product.id}
          variants={product.variants.map((v) => ({
            ...v,
            price: Number(v.price),
            compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
          }))}
        />
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft mb-3">Images</h2>
        <ImageManager productId={product.id} images={product.images} />
      </div>
    </div>
  );
}
