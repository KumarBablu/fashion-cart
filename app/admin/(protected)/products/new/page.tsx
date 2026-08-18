import { prisma } from "@/lib/db";
import ProductForm from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return (
    <div className="max-w-4xl space-y-4">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
          <span>✨</span> Add New Luxury Garment
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Save the primary product information first, then configure sizes, SKU variants, stock quantities, and high-resolution lookbook photos.
        </p>
      </div>

      <div className="mt-4">
        <ProductForm
          categories={categories.map((c) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            parentId: c.parentId,
          }))}
        />
      </div>
    </div>
  );
}
