import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatINR } from "@/lib/format";
import DownloadCsvButton from "@/components/admin/DownloadCsvButton";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status = "UNDER_REVIEW" } = await searchParams;

  const payments = await prisma.payment.findMany({
    where: { status: status as never },
    orderBy: { submittedAt: "asc" },
    include: { order: { include: { user: true } } },
  });

  const STATUSES = ["UNDER_REVIEW", "VERIFIED", "REJECTED", "PAYMENT_PENDING"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <span>💳</span> Payment Verification Desk
          </h1>
          <p className="text-xs text-dim mt-0.5">Verify UPI screenshot proofs, match bank UTR numbers, and approve invoices</p>
        </div>
        <DownloadCsvButton type="payments" label="Export Payments CSV" />
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/payments?status=${s}`}
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
            {payments.map((p) => (
              <tr key={p.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3 font-medium">{p.order.orderNumber}</td>
                <td className="px-4 py-3 text-ink-soft">{p.order.user.name}</td>
                <td className="px-4 py-3">{formatINR(p.amount)}</td>
                <td className="px-4 py-3 font-mono text-xs">{p.utrNumber ?? "—"}</td>
                <td className="px-4 py-3 text-ink-soft">{p.submittedAt ? new Date(p.submittedAt).toLocaleString("en-IN") : "—"}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/orders/${p.orderId}`} className="text-marigold-deep hover:underline text-xs font-medium">
                    Review
                  </Link>
                </td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-ink-soft">No payments in this state.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
