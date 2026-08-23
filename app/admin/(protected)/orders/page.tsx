import { cookies } from "next/headers";
import Link from "next/link";
import { getDb } from "@/lib/db";
import { formatINR } from "@/lib/format";
import { Prisma } from "@prisma/client";
import DownloadCsvButton from "@/components/admin/DownloadCsvButton";

export const dynamic = "force-dynamic";

const ORDER_STATUSES = [
  "PENDING_PAYMENT", "PAYMENT_REVIEW", "CONFIRMED", "PROCESSING", "PACKED",
  "SHIPPED", "DELIVERED", "CANCELLED", "REFUND_PENDING", "REFUNDED",
];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string; store?: string }>;
}) {
  const sp = await searchParams;
  const cookieStore = await cookies();
  const cookieStoreVal = cookieStore.get("fc_admin_store")?.value;

  const store = sp.store === "jewellery" || (!sp.store && cookieStoreVal === "jewellery") ? "jewellery" : "garments";
  const db = getDb(store);

  const page = Math.max(1, Number(sp.page ?? 1));
  const pageSize = 25;

  const where: Prisma.OrderWhereInput = {
    ...(sp.status ? { status: sp.status as Prisma.OrderWhereInput["status"] } : {}),
    ...(sp.q
      ? {
          OR: [
            { orderNumber: { contains: sp.q, mode: "insensitive" } },
            { user: { name: { contains: sp.q, mode: "insensitive" } } },
            { user: { email: { contains: sp.q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [orders, total] = await Promise.all([
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { user: true, payment: true },
    }),
    db.order.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="h-full overflow-y-auto min-h-0 space-y-6 pr-1 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <span>📦</span> Orders Fulfillment Desk ({store === "jewellery" ? "💍 Jewellery" : "👗 Garments"})
          </h1>
          <p className="text-xs text-dim mt-0.5">Manage customer orders, track courier logistics, and verify payments ({total} total {store} orders)</p>
        </div>
        <DownloadCsvButton type="orders" label={`Export ${store === "jewellery" ? "Jewellery" : "Garments"} Orders CSV`} />
      </div>

      <form className="flex flex-wrap gap-2" method="GET">
        <input type="hidden" name="store" value={store} />
        <input name="q" defaultValue={sp.q} placeholder="Search order #, name, email…" className="rounded-xl border px-3 py-2 text-xs outline-none focus:border-primary" style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }} />
        <select name="status" defaultValue={sp.status ?? ""} className="rounded-xl border px-3 py-2 text-xs outline-none focus:border-primary" style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}>
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
          ))}
        </select>
        <button className="rounded-xl bg-ink px-4 py-2 text-xs font-bold uppercase text-white shadow-xs cursor-pointer" style={{ backgroundColor: "var(--fc-primary)" }}>Filter</button>
      </form>

      <div className="mt-6 overflow-x-auto rounded-lg border border-line bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-soft">
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-line last:border-0 hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/admin/orders/${o.id}?store=${store}`} className="font-bold text-primary hover:underline">{o.orderNumber}</Link>
                </td>
                <td className="px-4 py-3 text-ink-soft">
                  <div className="font-medium text-[#141416]">{o.user?.name || "Guest Customer"}</div>
                  <div className="text-[10px] text-dim">{o.user?.email}</div>
                </td>
                <td className="px-4 py-3 text-ink-soft">{new Date(o.createdAt).toLocaleDateString("en-IN")}</td>
                <td className="px-4 py-3 font-mono font-bold">{formatINR(o.total)}</td>
                <td className="px-4 py-3 text-ink-soft">
                  <span className="text-xs font-mono">{o.payment?.status.replace(/_/g, " ")}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    o.status === "CONFIRMED" || o.status === "DELIVERED"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : o.status === "PENDING_PAYMENT"
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : "bg-slate-100 text-slate-700 border border-slate-200"
                  }`}>
                    {o.status.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/orders/${o.id}?store=${store}`}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#FAF8F5] text-[#141416] border border-[#E7DFD5] hover:border-[#C59B27] hover:text-[#C59B27] transition-all cursor-pointer"
                  >
                    <span>Manage / Reachout →</span>
                  </Link>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-ink-soft">No {store} orders found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex gap-2 text-sm">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link key={p} href={`/admin/orders?page=${p}&store=${store}`} className={`h-8 w-8 flex items-center justify-center rounded-full border ${p === page ? "bg-ink text-white border-ink" : "border-line"}`}>
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
