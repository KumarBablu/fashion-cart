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
      include: {
        variants: { orderBy: [{ colour: "asc" }, { size: "asc" }] },
        images: { orderBy: { sortOrder: "asc" } },
      },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
  ]);

  if (!product) notFound();

  return (
    <div className="max-w-4xl space-y-8">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
            <span>✏️</span> Edit Garment Listing
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-mono">ID: {product.id} • Slug: /{product.slug}</p>
        </div>
        <ArchiveProductButton slug={product.slug} archived={product.status === "ARCHIVED"} />
      </div>

      <div>
        <ProductForm
          categories={categories.map((c) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            parentId: c.parentId,
          }))}
          existing={{
            id: product.id,
            productId: product.productId,
            name: product.name,
            slug: product.slug,
            description: product.description,
            categoryId: product.categoryId,
            department: product.department,
            subcategory: product.subcategory,
            categoryPath: product.categoryPath,
            productType: product.productType,
            productUrl: product.productUrl,
            brand: product.brand,
            fabric: product.fabric,
            material: product.material,
            pattern: product.pattern,
            fit: product.fit,
            occasion: product.occasion,
            availability: product.availability,
            currency: product.currency,
            sellerName: product.sellerName,
            sellerIdentifier: product.sellerIdentifier,
            sellerPhone: product.sellerPhone,
            sellerEmail: product.sellerEmail,
            sellerUrl: product.sellerUrl,
            status: product.status as "ACTIVE" | "ARCHIVED" | "DRAFT",
            isFeatured: product.isFeatured,
            isNewArrival: product.isNewArrival,
            isBestSeller: product.isBestSeller,
          }}
        />
      </div>

      <div className="space-y-3 pt-6 border-t border-slate-200">
        <h2 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
          <span>📦</span> Variants &amp; Inventory Quantities
        </h2>
        <VariantManager
          productId={product.id}
          variants={product.variants.map((v) => ({
            ...v,
            price: Number(v.price),
            compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
          }))}
        />
      </div>

      <div className="space-y-3 pt-6 border-t border-slate-200">
        <h2 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
          <span>🖼️</span> Lookbook &amp; Product Images
        </h2>
        <ImageManager productId={product.id} images={product.images} />
      </div>
    </div>
  );
}
