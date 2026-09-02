import { cookies } from "next/headers";
import Link from "next/link";
import { getDb } from "@/lib/db";
import { formatINR } from "@/lib/format";
import { Prisma } from "@prisma/client";
import DownloadCsvButton from "@/components/admin/DownloadCsvButton";
import OrdersTableWithBatchDispatch from "@/components/admin/OrdersTableWithBatchDispatch";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const FILTER_TABS = [
  { label: "All Orders", status: "" },
  { label: "⏳ Action Required", status: "ACTION_REQUIRED" },
  { label: "✓ Confirmed", status: "CONFIRMED" },
  { label: "📦 Processing", status: "PROCESSING" },
  { label: "🚚 Shipped", status: "SHIPPED" },
  { label: "🎁 Delivered", status: "DELIVERED" },
  { label: "🚫 Cancelled", status: "CANCELLED" },
  { label: "💸 Refund in Process / Refunded", status: "REFUND" },
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

  let statusFilter = sp.status;
  let statusWhere: Prisma.OrderWhereInput["status"] | { in: any[] } | undefined = undefined;

  if (statusFilter === "ACTION_REQUIRED") {
    statusWhere = { in: ["PENDING_PAYMENT", "PAYMENT_REVIEW"] as any };
  } else if (statusFilter === "REFUND") {
    statusWhere = { in: ["REFUND_PENDING", "REFUNDED"] as any };
  } else if (statusFilter) {
    statusWhere = statusFilter as any;
  }

  const where: Prisma.OrderWhereInput = {
    ...(statusWhere ? { status: statusWhere as any } : {}),
    ...(sp.q
      ? {
          OR: [
            { orderNumber: { contains: sp.q, mode: "insensitive" } },
            { user: { name: { contains: sp.q, mode: "insensitive" } } },
            { user: { email: { contains: sp.q, mode: "insensitive" } } },
            { cancelReason: { contains: sp.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [orders, total, garmentsCount, jewelleryCount] = await Promise.all([
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { user: true, payment: true, shipment: true },
    }),
    db.order.count({ where }),
    getDb("garments").order.count().catch(() => 0),
    getDb("jewellery").order.count().catch(() => 0),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="h-full overflow-y-auto min-h-0 space-y-6 pr-1 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <span>📦</span> Orders Fulfillment Desk
            </h1>
            <div className="flex items-center gap-1.5 p-1 rounded-full bg-black/5 dark:bg-white/5 border border-[#E7DFD5] dark:border-neutral-800">
              <Link
                href={`/admin/orders?store=garments${statusFilter ? `&status=${statusFilter}` : ""}`}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  store === "garments"
                    ? "bg-[#141416] text-white shadow-xs"
                    : "text-dim hover:text-text"
                }`}
              >
                👗 Garments ({garmentsCount})
              </Link>
              <Link
                href={`/admin/orders?store=jewellery${statusFilter ? `&status=${statusFilter}` : ""}`}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  store === "jewellery"
                    ? "bg-[#C59B27] text-white shadow-xs"
                    : "text-dim hover:text-text"
                }`}
              >
                💍 Jewellery ({jewelleryCount})
              </Link>
            </div>
          </div>
          <p className="text-xs text-dim mt-1">
            Real-time status of customer orders, payments, cancellations, and gateway refunds ({total} orders match filter)
          </p>
        </div>
        <DownloadCsvButton type="orders" label={`Export ${store === "jewellery" ? "Jewellery" : "Garments"} Orders CSV`} />
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 text-xs">
        {FILTER_TABS.map((tab) => {
          const isActive = (sp.status || "") === tab.status;
          return (
            <Link
              key={tab.label}
              href={`/admin/orders?store=${store}${tab.status ? `&status=${tab.status}` : ""}${sp.q ? `&q=${encodeURIComponent(sp.q)}` : ""}`}
              className={`px-3.5 py-1.5 rounded-full font-bold transition-all border ${
                isActive
                  ? "bg-[#141416] text-white border-[#141416] shadow-xs"
                  : "bg-white dark:bg-neutral-900 border-[#E7DFD5] dark:border-neutral-800 text-dim hover:border-primary hover:text-primary"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Search Input Bar */}
      <form className="flex flex-wrap gap-2" method="GET">
        <input type="hidden" name="store" value={store} />
        {sp.status && <input type="hidden" name="status" value={sp.status} />}
        <input
          name="q"
          defaultValue={sp.q}
          placeholder="Search order #, customer name, email, or cancellation reason…"
          className="flex-1 min-w-[260px] rounded-xl border px-3.5 py-2 text-xs outline-none focus:border-primary"
          style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}
        />
        <button
          type="submit"
          className="rounded-xl px-5 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-xs cursor-pointer"
          style={{ backgroundColor: "var(--fc-primary)" }}
        >
          Search
        </button>
        {sp.q && (
          <Link
            href={`/admin/orders?store=${store}${sp.status ? `&status=${sp.status}` : ""}`}
            className="rounded-xl border px-3 py-2 text-xs font-semibold text-dim hover:text-text flex items-center"
            style={{ borderColor: "var(--fc-border)" }}
          >
            Clear ✕
          </Link>
        )}
      </form>

      {/* Orders Table with Batch Dispatch */}
      <OrdersTableWithBatchDispatch
        store={store}
        orders={orders.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          createdAt: o.createdAt.toISOString(),
          total: Number(o.total),
          status: o.status,
          paymentMethod: o.paymentMethod,
          cancelReason: o.cancelReason,
          user: o.user ? { name: o.user.name, email: o.user.email } : null,
          payment: o.payment
            ? {
                status: o.payment.status,
                refundStatus: o.payment.refundStatus,
                refundId: o.payment.refundId,
                instrumentDetails: o.payment.instrumentDetails,
              }
            : null,
          shipment: o.shipment
            ? {
                id: o.shipment.id,
                carrierName: o.shipment.carrierName,
                awbNumber: o.shipment.awbNumber,
                status: o.shipment.status,
              }
            : null,
          carrierName: o.carrierName,
          trackingNumber: o.trackingNumber,
        }))}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2 text-xs font-bold">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/orders?page=${p}&store=${store}${sp.status ? `&status=${sp.status}` : ""}${sp.q ? `&q=${encodeURIComponent(sp.q)}` : ""}`}
              className={`h-8 w-8 flex items-center justify-center rounded-full border transition-all ${
                p === page ? "bg-primary text-white border-primary shadow-xs" : "border-line text-dim hover:text-text"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
