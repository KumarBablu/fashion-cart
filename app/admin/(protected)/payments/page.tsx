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

      <div className="mt-6 overflow-x-auto rounded-lg border border-line bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-soft">
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">UTR</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-ink-soft">
                  No {status.toLowerCase().replace(/_/g, " ")} payments in {store} database.
                </td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr key={p.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-medium">{p.order.orderNumber}</td>
                  <td className="px-4 py-3 text-ink-soft">{p.order.user.name}</td>
                  <td className="px-4 py-3">{formatINR(p.amount)}</td>
                  <td className="px-4 py-3 font-mono">{p.utrNumber ?? "—"}</td>
                  <td className="px-4 py-3 text-ink-soft">{p.submittedAt ? new Date(p.submittedAt).toLocaleDateString() : "—"}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${p.orderId}?store=${store}`} className="text-xs font-bold text-amber-600 hover:underline">
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
