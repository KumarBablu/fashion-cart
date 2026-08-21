import Link from "next/link";
import { prisma } from "@/lib/db";
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
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const sp = await searchParams;
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
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { user: true, payment: true },
    }),
    prisma.order.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="h-full overflow-y-auto min-h-0 space-y-6 pr-1 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <span>📦</span> Orders Fulfillment Desk
          </h1>
          <p className="text-xs text-dim mt-0.5">Manage customer orders, track courier logistics, and verify payments ({total} total orders)</p>
        </div>
        <DownloadCsvButton type="orders" label="Export Orders CSV" />
      </div>

      <form className="flex flex-wrap gap-2" method="GET">
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
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3">
                  <Link href={`/admin/orders/${o.id}`} className="font-medium hover:text-marigold-deep">{o.orderNumber}</Link>
                </td>
                <td className="px-4 py-3 text-ink-soft">{o.user.name}</td>
                <td className="px-4 py-3 text-ink-soft">{new Date(o.createdAt).toLocaleDateString("en-IN")}</td>
                <td className="px-4 py-3">{formatINR(o.total)}</td>
                <td className="px-4 py-3 text-ink-soft">{o.payment?.status.replace(/_/g, " ")}</td>
                <td className="px-4 py-3">{o.status.replace(/_/g, " ")}</td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-ink-soft">No orders found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex gap-2 text-sm">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link key={p} href={`/admin/orders?page=${p}`} className={`h-8 w-8 flex items-center justify-center rounded-full border ${p === page ? "bg-ink text-white border-ink" : "border-line"}`}>
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
