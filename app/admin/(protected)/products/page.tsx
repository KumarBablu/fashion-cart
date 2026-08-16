import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatINR } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam ?? 1));
  const pageSize = 20;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { category: true, variants: true, images: { take: 1 } },
    }),
    prisma.product.count(),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl">Products</h1>
        <Link href="/admin/products/new" className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white">
          + Add Product
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-line bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-soft">
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Variants</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const totalStock = p.variants.reduce((s, v) => s + v.stockQuantity, 0);
              const minPrice = p.variants.length ? Math.min(...p.variants.map((v) => v.price.toNumber())) : 0;
              return (
                <tr key={p.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-ink-soft">{formatINR(minPrice)}</p>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{p.category?.name}</td>
                  <td className="px-4 py-3 text-ink-soft">{p.variants.length}</td>
                  <td className="px-4 py-3 text-ink-soft">{totalStock}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-line text-ink-soft"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/products/${p.id}`} className="text-marigold-deep hover:underline text-xs font-medium">
                      Edit
                    </Link>
                  </td>
                </tr>
              );
            })}
            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-ink-soft">No products yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex gap-2 text-sm">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/products?page=${p}`}
              className={`h-8 w-8 flex items-center justify-center rounded-full border ${p === page ? "bg-ink text-white border-ink" : "border-line"}`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
