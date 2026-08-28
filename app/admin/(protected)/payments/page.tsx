import { cookies } from "next/headers";
import Link from "next/link";
import { getDb } from "@/lib/db";
import { formatINR } from "@/lib/format";
import DownloadCsvButton from "@/components/admin/DownloadCsvButton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SearchParams = { status?: string; store?: string; q?: string };

const PAYMENT_TABS = [
  { label: "All Payments", status: "" },
  { label: "⏳ Proofs in Review", status: "UNDER_REVIEW" },
  { label: "✓ Verified & Paid", status: "VERIFIED" },
  { label: "💸 Refunded / In Process", status: "REFUNDED" },
  { label: "✕ Rejected", status: "REJECTED" },
  { label: "🕒 Awaiting Payment", status: "PAYMENT_PENDING" },
];

export default async function AdminPaymentsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const cookieStore = await cookies();
  const cookieStoreVal = cookieStore.get("fc_admin_store")?.value;

  const store = sp.store === "jewellery" || (!sp.store && cookieStoreVal === "jewellery") ? "jewellery" : "garments";
  const db = getDb(store);

  const status = sp.status ?? "";

  let whereClause: any = {};

  if (status === "REFUNDED") {
    whereClause = {
      OR: [
        { refundStatus: { not: null } },
        { refundId: { not: null } },
        { order: { status: { in: ["REFUND_PENDING", "REFUNDED"] } } },
      ],
    };
  } else if (status) {
    whereClause = { status };
  }

  if (sp.q) {
    whereClause = {
      ...whereClause,
      OR: [
        { utrNumber: { contains: sp.q, mode: "insensitive" } },
        { refundId: { contains: sp.q, mode: "insensitive" } },
        { order: { orderNumber: { contains: sp.q, mode: "insensitive" } } },
        { order: { user: { name: { contains: sp.q, mode: "insensitive" } } } },
        { order: { user: { email: { contains: sp.q, mode: "insensitive" } } } },
      ],
    };
  }

  const [payments, garmentsCount, jewelleryCount] = await Promise.all([
    db.payment.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: { order: { include: { user: true } } },
      take: 50,
    }),
    getDb("garments").payment.count().catch(() => 0),
    getDb("jewellery").payment.count().catch(() => 0),
  ]);

  return (
    <div className="h-full overflow-y-auto min-h-0 space-y-6 pr-1 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <span>💳</span> Payment &amp; Refund Audit Desk
            </h1>
            <div className="flex items-center gap-1.5 p-1 rounded-full bg-black/5 dark:bg-white/5 border border-[#E7DFD5] dark:border-neutral-800">
              <Link
                href={`/admin/payments?store=garments${status ? `&status=${status}` : ""}`}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  store === "garments"
                    ? "bg-[#141416] text-white shadow-xs"
                    : "text-dim hover:text-text"
                }`}
              >
                👗 Garments ({garmentsCount})
              </Link>
              <Link
                href={`/admin/payments?store=jewellery${status ? `&status=${status}` : ""}`}
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
            Real-time verification of Razorpay online transactions, manual UPI proofs, and banking gateway refunds ({payments.length} transactions shown)
          </p>
        </div>
        <DownloadCsvButton type="payments" label="Export Payments CSV" />
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 text-xs">
        {PAYMENT_TABS.map((tab) => {
          const isActive = status === tab.status;
          return (
            <Link
              key={tab.label}
              href={`/admin/payments?store=${store}${tab.status ? `&status=${tab.status}` : ""}${sp.q ? `&q=${encodeURIComponent(sp.q)}` : ""}`}
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

      {/* Search Input */}
      <form className="flex flex-wrap gap-2" method="GET">
        <input type="hidden" name="store" value={store} />
        {status && <input type="hidden" name="status" value={status} />}
        <input
          name="q"
          defaultValue={sp.q}
          placeholder="Search transaction UTR, Refund ID, order #, or customer…"
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
            href={`/admin/payments?store=${store}${status ? `&status=${status}` : ""}`}
            className="rounded-xl border px-3 py-2 text-xs font-semibold text-dim hover:text-text flex items-center"
            style={{ borderColor: "var(--fc-border)" }}
          >
            Clear ✕
          </Link>
        )}
      </form>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-line bg-white dark:bg-neutral-900 shadow-xs">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-soft bg-slate-50/50 dark:bg-neutral-800/40">
              <th className="px-4 py-3.5">Order #</th>
              <th className="px-4 py-3.5">Customer</th>
              <th className="px-4 py-3.5">Amount</th>
              <th className="px-4 py-3.5">Payment Gateway &amp; Channel</th>
              <th className="px-4 py-3.5">Transaction ID / UTR</th>
              <th className="px-4 py-3.5">Payment &amp; Refund Status</th>
              <th className="px-4 py-3.5">Date</th>
              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-12 text-center text-dim text-xs">
                  No payment records found matching the selected filter.
                </td>
              </tr>
            ) : (
              payments.map((p) => {
                const isRefundCompleted = p.refundStatus === "PROCESSED" || p.order.status === "REFUNDED";
                const isRefundPending = p.refundStatus === "INITIATED" || p.order.status === "REFUND_PENDING";

                return (
                  <tr key={p.id} className="border-b border-line last:border-0 hover:bg-slate-50/60 dark:hover:bg-neutral-800/50 transition-colors">
                    {/* Order Ref */}
                    <td className="px-4 py-3.5 font-bold font-mono text-xs">
                      <Link href={`/admin/orders/${p.orderId}?store=${store}`} className="text-primary hover:underline">
                        {p.order.orderNumber}
                      </Link>
                    </td>

                    {/* Customer */}
                    <td className="px-4 py-3.5 text-ink-soft">
                      <div className="font-semibold text-[#141416] dark:text-white text-xs">{p.order.user?.name || "Customer"}</div>
                      <div className="text-[10px] text-dim">{p.order.user?.email}</div>
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-3.5 font-bold font-mono text-xs text-[#141416] dark:text-white">
                      {formatINR(p.amount)}
                    </td>

                    {/* Gateway & Channel */}
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col gap-0.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold w-max ${
                          p.method === "ONLINE_GATEWAY"
                            ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200"
                            : p.method === "MANUAL_UPI"
                            ? "bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200"
                            : "bg-slate-100 text-slate-800 dark:bg-neutral-800 dark:text-neutral-300 border border-slate-200"
                        }`}>
                          {p.method === "ONLINE_GATEWAY" ? "⚡ Razorpay" : p.method === "MANUAL_UPI" ? "📱 Manual UPI" : "💵 COD"}
                        </span>
                        {p.paymentChannel && (
                          <span className="text-[11px] font-medium text-dim">
                            {p.paymentChannel} {p.instrumentDetails ? `· ${p.instrumentDetails}` : ""}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Transaction / UTR */}
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-700 dark:text-slate-300">
                      {p.utrNumber ? (
                        <div className="flex items-center gap-1.5">
                          <span className="bg-slate-100 dark:bg-neutral-800 px-2 py-0.5 rounded border border-slate-200 dark:border-neutral-700 text-[11px]">
                            {p.utrNumber}
                          </span>
                          {p.utrNumber.startsWith("pay_") && (
                            <a
                              href={`https://dashboard.razorpay.com/app/payments/${p.utrNumber}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:text-emerald-700 font-bold text-xs"
                              title="Open Payment in Razorpay Dashboard"
                            >
                              ↗
                            </a>
                          )}
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>

                    {/* Payment & Refund Status Badge */}
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col gap-1">
                        {/* Refund Info */}
                        {isRefundCompleted ? (
                          <div className="flex items-center gap-1.5">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 w-max">
                              ✓ REFUND CREDITED
                            </span>
                            {p.refundId && (
                              <a
                                href={`https://dashboard.razorpay.com/app/refunds/${p.refundId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-mono text-[10px] text-primary hover:underline"
                                title="Open Refund in Razorpay"
                              >
                                {p.refundId} ↗
                              </a>
                            )}
                          </div>
                        ) : isRefundPending ? (
                          <div className="flex items-center gap-1.5">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 animate-pulse w-max">
                              ⚡ REFUND IN TRANSIT
                            </span>
                            {p.refundId && (
                              <a
                                href={`https://dashboard.razorpay.com/app/refunds/${p.refundId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-mono text-[10px] text-primary hover:underline"
                              >
                                {p.refundId} ↗
                              </a>
                            )}
                          </div>
                        ) : (
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider w-max ${
                              p.status === "VERIFIED"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300"
                                : p.status === "REJECTED"
                                ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300"
                            }`}
                          >
                            {p.status.replace(/_/g, " ")}
                          </span>
                        )}

                        {p.refundArn && (
                          <span className="text-[10px] font-mono text-dim">
                            Bank ARN: {p.refundArn}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3.5 text-dim text-xs whitespace-nowrap">
                      {p.verifiedAt
                        ? new Date(p.verifiedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                        : p.submittedAt
                        ? new Date(p.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                        : new Date(p.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </td>

                    {/* Review Button */}
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        href={`/admin/orders/${p.orderId}?store=${store}`}
                        className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#141416] text-white hover:bg-[#25262B] transition-all inline-block shadow-2xs"
                      >
                        Inspect →
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
