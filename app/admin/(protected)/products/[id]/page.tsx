import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import ProductForm from "@/components/admin/ProductForm";
import VariantManager from "@/components/admin/VariantManager";
import ImageManager from "@/components/admin/ImageManager";
import ArchiveProductButton from "@/components/admin/ArchiveProductButton";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Check garments first, then jewellery
  let activeStore: "garments" | "jewellery" = "garments";
  let db = getDb(activeStore);

  let [product, categories] = await Promise.all([
    db.product.findUnique({
      where: { id },
      include: {
        variants: { orderBy: [{ colour: "asc" }, { size: "asc" }] },
        images: { orderBy: { sortOrder: "asc" } },
      },
    }),
    db.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
  ]);

  if (!product) {
    activeStore = "jewellery";
    db = getDb(activeStore);
    [product, categories] = await Promise.all([
      db.product.findUnique({
        where: { id },
        include: {
          variants: { orderBy: [{ colour: "asc" }, { size: "asc" }] },
          images: { orderBy: { sortOrder: "asc" } },
        },
      }),
      db.category.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      }),
    ]);
  }

  if (!product) notFound();

  return (
    <div className="w-full max-w-5xl space-y-8 pb-20">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">{activeStore === "jewellery" ? "💍" : "👗"}</span>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
              Edit {activeStore === "jewellery" ? "Jewellery Piece" : "Garment Listing"}
            </h1>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              activeStore === "jewellery" ? "bg-amber-100 text-amber-900 border border-amber-300" : "bg-slate-100 text-slate-700 border border-slate-300"
            }`}>
              {activeStore}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-mono">ID: {product.id} • Slug: /{product.slug}</p>
        </div>
        <ArchiveProductButton slug={product.slug} archived={product.status === "ARCHIVED"} />
      </div>

      <div>
        <ProductForm
          store={activeStore}
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
            specifications: product.specifications,
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
          <span>🖼️</span> Lookbook Photos &amp; Image URLs
        </h2>
        <ImageManager productId={product.id} images={product.images} />
      </div>
    </div>
  );
}
