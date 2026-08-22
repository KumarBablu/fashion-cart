import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import ProductForm from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | undefined>;

export default async function NewProductPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const cookieStore = await cookies();
  const cookieStoreVal = cookieStore.get("fc_admin_store")?.value;

  const store = sp.store === "jewellery" || (!sp.store && cookieStoreVal === "jewellery") ? "jewellery" : "garments";
  const db = getDb(store);

  const categories = await db.category.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return (
    <div className="h-full overflow-y-auto min-h-0 max-w-4xl space-y-4 pr-1 pb-12">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{store === "jewellery" ? "💍" : "✨"}</span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
            Add New {store === "jewellery" ? "Jewellery Listing" : "Luxury Garment"}
          </h1>
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            store === "jewellery" ? "bg-amber-100 text-amber-900 border border-amber-300" : "bg-slate-100 text-slate-700 border border-slate-300"
          }`}>
            {store}
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Save the primary product information first, then configure sizes, SKU variants, stock quantities, and high-resolution lookbook photos (via file upload or direct web links).
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
