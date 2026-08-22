import { cookies } from "next/headers";
import Link from "next/link";
import { getDb } from "@/lib/db";
import DownloadCsvButton from "@/components/admin/DownloadCsvButton";

export const dynamic = "force-dynamic";

const LOW_STOCK_THRESHOLD = 5;

const STATUS_STYLE: Record<string, string> = {
  IN_STOCK: "bg-emerald-100 text-emerald-700",
  LOW_STOCK: "bg-amber-100 text-amber-700",
  OUT_OF_STOCK: "bg-red-100 text-red-700",
};

type SearchParams = { status?: string; store?: string };

export default async function AdminInventoryPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const cookieStore = await cookies();
  const cookieStoreVal = cookieStore.get("fc_admin_store")?.value;

  const store = sp.store === "jewellery" || (!sp.store && cookieStoreVal === "jewellery") ? "jewellery" : "garments";
  const db = getDb(store);

  const variants = await db.productVariant.findMany({
    where: { isActive: true },
    orderBy: { stockQuantity: "asc" },
    include: { product: { select: { name: true, slug: true } } },
  });

  const withStatus = variants.map((v) => ({
    ...v,
    stockStatus: v.stockQuantity === 0 ? "OUT_OF_STOCK" : v.stockQuantity <= LOW_STOCK_THRESHOLD ? "LOW_STOCK" : "IN_STOCK",
  }));

  const filtered = sp.status ? withStatus.filter((v) => v.stockStatus === sp.status) : withStatus;

  return (
    <div className="h-full overflow-y-auto min-h-0 space-y-6 pr-1 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <span>{store === "jewellery" ? "💍" : "📊"}</span> {store === "jewellery" ? "Jewellery Stock & Inventory" : "Inventory & Stock Levels"}
          </h1>
          <p className="text-xs text-dim mt-0.5">
            Real-time stock quantities across all size, polish, and SKU variants for {store === "jewellery" ? "Jewellery" : "Garments"} ({filtered.length} SKUs)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <DownloadCsvButton type="inventory" label="Export Inventory CSV" />
          <div className="flex gap-1.5 text-xs">
            {["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"].map((s) => (
              <Link
                key={s}
                href={`/admin/inventory?status=${s}&store=${store}`}
                className={`rounded-full border px-3 py-1.5 font-bold ${sp.status === s ? "border-amber-500 bg-amber-600 text-white" : "border-line text-ink-soft hover:border-amber-500"}`}
              >
                {s.replace(/_/g, " ")}
              </Link>
            ))}
            <Link href={`/admin/inventory?store=${store}`} className={`rounded-full border px-3 py-1.5 font-bold ${!sp.status ? "border-amber-500 bg-amber-600 text-white" : "border-line text-ink-soft hover:border-amber-500"}`}>
              All
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-line bg-white">
        <table className="min-w-full divide-y divide-line text-xs">
          <thead className="bg-ivory-deep">
            <tr>
              <th className="px-4 py-3 text-left font-bold text-ink-soft">SKU</th>
              <th className="px-4 py-3 text-left font-bold text-ink-soft">Product Name</th>
              <th className="px-4 py-3 text-left font-bold text-ink-soft">Colour / Finish</th>
              <th className="px-4 py-3 text-left font-bold text-ink-soft">Size / Fit</th>
              <th className="px-4 py-3 text-right font-bold text-ink-soft">Price</th>
              <th className="px-4 py-3 text-right font-bold text-ink-soft">Stock Qty</th>
              <th className="px-4 py-3 text-left font-bold text-ink-soft">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-ink-soft">
                  No items found in {store} inventory.
                </td>
              </tr>
            ) : (
              filtered.map((v) => (
                <tr key={v.id} className="hover:bg-ivory-deep">
                  <td className="px-4 py-3 font-mono font-bold text-ink">{v.sku}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/products/${v.productId}`} className="font-semibold text-ink hover:underline">
                      {v.product.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{v.colour}</td>
                  <td className="px-4 py-3 font-mono text-ink-soft">{v.size}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-ink">₹{Number(v.price).toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-ink">{v.stockQuantity}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_STYLE[v.stockStatus]}`}>
                      {v.stockStatus.replace(/_/g, " ")}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
