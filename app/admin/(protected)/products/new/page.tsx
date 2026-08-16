import { prisma } from "@/lib/db";
import ProductForm from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <h1 className="font-display text-2xl">Add Product</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Save the product first, then add variants (size/colour/stock) and images on the next screen.
      </p>
      <div className="mt-6 max-w-2xl">
        <ProductForm categories={categories.map((c) => ({ id: c.id, name: c.name }))} />
      </div>
    </div>
  );
}
