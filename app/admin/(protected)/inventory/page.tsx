import Link from "next/link";
import { prisma } from "@/lib/db";
import DownloadCsvButton from "@/components/admin/DownloadCsvButton";

export const dynamic = "force-dynamic";

const LOW_STOCK_THRESHOLD = 5;

const STATUS_STYLE: Record<string, string> = {
  IN_STOCK: "bg-emerald-100 text-emerald-700",
  LOW_STOCK: "bg-amber-100 text-amber-700",
  OUT_OF_STOCK: "bg-red-100 text-red-700",
};

export default async function AdminInventoryPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;

  const variants = await prisma.productVariant.findMany({
    where: { isActive: true },
    orderBy: { stockQuantity: "asc" },
    include: { product: { select: { name: true, slug: true } } },
  });

  const withStatus = variants.map((v) => ({
    ...v,
    stockStatus: v.stockQuantity === 0 ? "OUT_OF_STOCK" : v.stockQuantity <= LOW_STOCK_THRESHOLD ? "LOW_STOCK" : "IN_STOCK",
  }));

  const filtered = status ? withStatus.filter((v) => v.stockStatus === status) : withStatus;

  return (
    <div className="h-full overflow-y-auto min-h-0 space-y-6 pr-1 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <span>📊</span> Inventory &amp; Stock Levels
          </h1>
          <p className="text-xs text-dim mt-0.5">Real-time stock quantities across all size and color variants ({filtered.length} SKUs)</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <DownloadCsvButton type="inventory" label="Export Inventory CSV" />
          <div className="flex gap-1.5 text-xs">
            {["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"].map((s) => (
              <Link
                key={s}
                href={`/admin/inventory?status=${s}`}
                className={`rounded-full border px-3 py-1.5 font-bold ${status === s ? "border-amber-500 bg-amber-600 text-white" : "border-line text-ink-soft hover:border-amber-500"}`}
              >
                {s.replace(/_/g, " ")}
              </Link>
            ))}
            <Link href="/admin/inventory" className={`rounded-full border px-3 py-1.5 font-bold ${!status ? "border-amber-500 bg-amber-600 text-white" : "border-line text-ink-soft hover:border-amber-500"}`}>
              All
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-line bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-soft">
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Colour</th>
              <th className="px-4 py-3">Size</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((v) => (
              <tr key={v.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3">
                  <Link href={`/admin/products/${v.productId}`} className="hover:text-marigold-deep">{v.product.name}</Link>
                </td>
                <td className="px-4 py-3 font-mono text-xs">{v.sku}</td>
                <td className="px-4 py-3 text-ink-soft">{v.colour}</td>
                <td className="px-4 py-3 text-ink-soft">{v.size}</td>
                <td className="px-4 py-3 font-medium">{v.stockQuantity}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[v.stockStatus]}`}>
                    {v.stockStatus.replace(/_/g, " ")}
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-ink-soft">No variants match this filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
