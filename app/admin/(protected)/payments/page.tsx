import { cookies } from "next/headers";
import Link from "next/link";
import { getDb } from "@/lib/db";
import { formatINR } from "@/lib/format";
import DownloadCsvButton from "@/components/admin/DownloadCsvButton";

export const dynamic = "force-dynamic";

type SearchParams = { status?: string; store?: string };

export default async function AdminPaymentsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const cookieStore = await cookies();
  const cookieStoreVal = cookieStore.get("fc_admin_store")?.value;

  const store = sp.store === "jewellery" || (!sp.store && cookieStoreVal === "jewellery") ? "jewellery" : "garments";
  const db = getDb(store);

  const status = sp.status || "UNDER_REVIEW";

  const payments = await db.payment.findMany({
    where: { status: status as never },
    orderBy: { submittedAt: "asc" },
    include: { order: { include: { user: true } } },
  });

  const STATUSES = ["UNDER_REVIEW", "VERIFIED", "REJECTED", "PAYMENT_PENDING"];

  return (
    <div className="h-full overflow-y-auto min-h-0 space-y-6 pr-1 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <span>💳</span> Payment Verification Desk
          </h1>
          <p className="text-xs text-dim mt-0.5">
            Verify UPI screenshot proofs, match bank UTR numbers, and approve invoices for {store === "jewellery" ? "Jewellery" : "Garments"}
          </p>
        </div>
        <DownloadCsvButton type="payments" label="Export Payments CSV" />
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/payments?status=${s}&store=${store}`}
            className={`rounded-full border px-3 py-1.5 font-bold ${status === s ? "border-amber-500 bg-amber-600 text-white" : "border-line text-ink-soft hover:border-amber-500"}`}
          >
            {s.replace(/_/g, " ")}
          </Link>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-line bg-white shadow-xs">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-soft bg-slate-50/50">
              <th className="px-4 py-3">Order #</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Gateway</th>
              <th className="px-4 py-3">Channel &amp; Instrument</th>
              <th className="px-4 py-3">UTR / Ref #</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-ink-soft">
                  No {status.toLowerCase().replace(/_/g, " ")} payments in {store} database.
                </td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr key={p.id} className="border-b border-line last:border-0 hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3 font-semibold text-[#141416]">
                    <Link href={`/admin/orders/${p.orderId}?store=${store}`} className="text-primary hover:underline">
                      {p.order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    <div className="font-medium text-[#141416]">{p.order.user.name}</div>
                    <div className="text-[10px] text-dim">{p.order.user.email}</div>
                  </td>
                  <td className="px-4 py-3 font-bold font-mono text-[#141416]">{formatINR(p.amount)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      p.method === "ONLINE_GATEWAY"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : p.method === "MANUAL_UPI"
                        ? "bg-blue-50 text-blue-800 border border-blue-200"
                        : "bg-slate-100 text-slate-800 border border-slate-200"
                    }`}>
                      {p.method === "ONLINE_GATEWAY" ? "⚡ Razorpay" : p.method === "MANUAL_UPI" ? "📱 Manual UPI" : "💵 COD"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs font-semibold text-[#141416]">
                      {p.paymentChannel || (p.method === "ONLINE_GATEWAY" ? "Instant Online" : p.method.replace(/_/g, " "))}
                    </div>
                    {p.instrumentDetails && (
                      <div className="text-[11px] text-dim font-medium">
                        {p.instrumentDetails}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-700">
                    {p.utrNumber ? (
                      <div className="flex items-center gap-1.5">
                        <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                          {p.utrNumber}
                        </span>
                        {p.utrNumber.startsWith("pay_") && (
                          <a
                            href={`https://dashboard.razorpay.com/app/payments/${p.utrNumber}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-emerald-700 font-bold text-xs"
                            title="View in Razorpay Dashboard"
                          >
                            ↗
                          </a>
                        )}
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-soft text-xs">
                    {p.verifiedAt
                      ? new Date(p.verifiedAt).toLocaleDateString("en-IN")
                      : p.submittedAt
                      ? new Date(p.submittedAt).toLocaleDateString("en-IN")
                      : new Date(p.createdAt).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/orders/${p.orderId}?store=${store}`}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#141416] text-white hover:bg-[#25262B] transition-all inline-block"
                    >
                      Review
                    </Link>
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
