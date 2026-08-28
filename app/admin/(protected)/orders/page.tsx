import { cookies } from "next/headers";
import Link from "next/link";
import { getDb } from "@/lib/db";
import { formatINR } from "@/lib/format";
import { Prisma } from "@prisma/client";
import DownloadCsvButton from "@/components/admin/DownloadCsvButton";

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
      include: { user: true, payment: true },
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

      {/* Orders Table */}
      <div className="overflow-x-auto rounded-2xl border border-line bg-white dark:bg-neutral-900 shadow-xs">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-soft bg-slate-50/50 dark:bg-neutral-800/40">
              <th className="px-4 py-3.5">Order #</th>
              <th className="px-4 py-3.5">Customer</th>
              <th className="px-4 py-3.5">Date</th>
              <th className="px-4 py-3.5">Amount</th>
              <th className="px-4 py-3.5">Payment &amp; Refund Status</th>
              <th className="px-4 py-3.5">Fulfillment Status</th>
              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => {
              const isPrepaid = o.payment?.status === "VERIFIED";
              const isRefundCompleted = o.payment?.refundStatus === "PROCESSED" || o.status === "REFUNDED";
              const isRefundPending = o.payment?.refundStatus === "INITIATED" || o.status === "REFUND_PENDING";
              const isCancelled = o.status === "CANCELLED" || isRefundCompleted || isRefundPending;

              return (
                <tr key={o.id} className="border-b border-line last:border-0 hover:bg-slate-50/60 dark:hover:bg-neutral-800/50 transition-colors">
                  {/* Order Number */}
                  <td className="px-4 py-3.5">
                    <Link href={`/admin/orders/${o.id}?store=${store}`} className="font-bold text-primary hover:underline font-mono text-xs">
                      {o.orderNumber}
                    </Link>
                  </td>

                  {/* Customer Info */}
                  <td className="px-4 py-3.5 text-ink-soft">
                    <div className="font-semibold text-[#141416] dark:text-white text-xs">{o.user?.name || "Guest Customer"}</div>
                    <div className="text-[10px] text-dim">{o.user?.email}</div>
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3.5 text-dim text-xs whitespace-nowrap">
                    {new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </td>

                  {/* Amount */}
                  <td className="px-4 py-3.5 font-mono font-bold text-xs">{formatINR(o.total)}</td>

                  {/* Payment & Refund Badge */}
                  <td className="px-4 py-3.5">
                    <div className="flex flex-col gap-1">
                      {/* Refund Status */}
                      {isRefundCompleted ? (
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                            ✓ REFUND CREDITED
                          </span>
                          {o.payment?.refundId && (
                            <span className="font-mono text-[10px] text-dim bg-black/5 dark:bg-white/5 px-1 rounded">
                              {o.payment.refundId}
                            </span>
                          )}
                        </div>
                      ) : isRefundPending ? (
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 animate-pulse">
                            ⚡ REFUND IN PROCESS
                          </span>
                          {o.payment?.refundId && (
                            <span className="font-mono text-[10px] text-dim bg-black/5 dark:bg-white/5 px-1 rounded">
                              {o.payment.refundId}
                            </span>
                          )}
                        </div>
                      ) : isPrepaid ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 w-max">
                          ✓ PAID · {o.payment?.paymentChannel || "Online Gateway"}
                        </span>
                      ) : o.payment?.status === "UNDER_REVIEW" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 w-max">
                          ⏳ Proof In Review
                        </span>
                      ) : o.payment?.status === "REJECTED" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 w-max">
                          ✕ Payment Rejected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-neutral-800 dark:text-neutral-300 border border-slate-200 w-max">
                          {o.paymentMethod === "COD" ? "💵 COD" : "🕒 Awaiting Payment"}
                        </span>
                      )}

                      {/* Instrument details */}
                      {o.payment?.instrumentDetails && (
                        <span className="text-[10px] text-dim font-medium">
                          {o.payment.instrumentDetails}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Order Status Badge */}
                  <td className="px-4 py-3.5">
                    <div className="flex flex-col gap-0.5">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider w-max ${
                        o.status === "CONFIRMED" || o.status === "DELIVERED"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300"
                          : o.status === "PROCESSING" || o.status === "PACKED"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300"
                          : o.status === "SHIPPED"
                          ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300"
                          : o.status === "CANCELLED"
                          ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300"
                          : o.status === "REFUND_PENDING"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300"
                          : o.status === "REFUNDED"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300"
                          : "bg-slate-100 text-slate-700 dark:bg-neutral-800 dark:text-neutral-300 border border-slate-200"
                      }`}>
                        {o.status.replace(/_/g, " ")}
                      </span>

                      {/* Cancellation reason snippet */}
                      {isCancelled && o.cancelReason && (
                        <span className="text-[10px] text-rose-700 dark:text-rose-400 italic max-w-[180px] truncate" title={o.cancelReason}>
                          Reason: {o.cancelReason}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5 text-right">
                    <Link
                      href={`/admin/orders/${o.id}?store=${store}`}
                      className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#FAF8F5] dark:bg-neutral-800 text-[#141416] dark:text-white border border-[#E7DFD5] dark:border-neutral-700 hover:border-primary hover:text-primary transition-all cursor-pointer shadow-2xs"
                    >
                      <span>Manage →</span>
                    </Link>
                  </td>
                </tr>
              );
            })}
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-dim text-xs">
                  No orders found matching the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
