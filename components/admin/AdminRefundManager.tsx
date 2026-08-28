"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatINR } from "@/lib/format";
import { useToast } from "@/components/providers/ToastProvider";

type AdminRefundManagerProps = {
  orderId: string;
  orderNumber: string;
  orderStatus: string;
  totalAmount: number;
  cancelledAt?: string | Date | null;
  cancelReason?: string | null;
  cancellationNotes?: string | null;
  payment?: {
    id: string;
    status: string;
    amount: number;
    utrNumber?: string | null;
    gatewayName?: string | null;
    paymentChannel?: string | null;
    instrumentDetails?: string | null;
    refundId?: string | null;
    refundStatus?: string | null;
    refundAmount?: number | null;
    refundArn?: string | null;
    refundSpeed?: string | null;
    refundCreatedAt?: string | Date | null;
    refundCompletedAt?: string | Date | null;
  } | null;
};

export default function AdminRefundManager({
  orderId,
  orderNumber,
  orderStatus,
  totalAmount,
  cancelledAt,
  cancelReason,
  cancellationNotes,
  payment,
}: AdminRefundManagerProps) {
  const router = useRouter();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState("Order cancelled - Customer requested refund");

  const isPrepaid = payment?.status === "VERIFIED" && Boolean(payment?.utrNumber);
  const hasRefund = Boolean(payment?.refundId || payment?.refundStatus);
  const refundAmount = payment?.refundAmount ? Number(payment.refundAmount) : totalAmount;
  const isRefundCompleted = payment?.refundStatus === "PROCESSED" || Boolean(payment?.refundCompletedAt);

  async function handleTriggerRefund() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: refundReason }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        error("Refund Failed", data.error || "Could not process gateway refund.");
        return;
      }

      success("Refund Processed 🎉", `Refund of ${formatINR(refundAmount)} initiated successfully.`);
      setShowRefundModal(false);
      router.refresh();
    } catch (err: any) {
      setLoading(false);
      error("Network Error", err.message || "Failed to reach server.");
    }
  }

  const isCancelledOrRefund =
    orderStatus === "CANCELLED" ||
    orderStatus === "REFUND_PENDING" ||
    orderStatus === "REFUNDED" ||
    hasRefund ||
    Boolean(cancelledAt);

  if (!isCancelledOrRefund && !isPrepaid) {
    return null;
  }

  return (
    <div className="p-6 rounded-3xl border border-rose-200 dark:border-rose-900 bg-rose-50/70 dark:bg-rose-950/30 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rose-200/80 dark:border-rose-900/80 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🛡️</span>
          <div>
            <h3 className="font-display text-base font-bold text-rose-950 dark:text-rose-100">
              Order Cancellation &amp; Refund Desk
            </h3>
            <p className="text-[11px] text-rose-800/80 dark:text-rose-300">
              Live audit of cancellation reason, stock restoration, and banking gateway refund
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase ${
              isRefundCompleted
                ? "bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300"
                : payment?.refundStatus === "INITIATED" || orderStatus === "REFUND_PENDING"
                ? "bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950 dark:text-amber-300 animate-pulse"
                : "bg-rose-200 text-rose-900 dark:bg-rose-900 dark:text-rose-100"
            }`}
          >
            {isRefundCompleted
              ? "✓ REFUND COMPLETED"
              : payment?.refundStatus === "INITIATED" || orderStatus === "REFUND_PENDING"
              ? "⚡ REFUND IN TRANSIT"
              : orderStatus.replace(/_/g, " ")}
          </span>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Left Column: Cancellation Details */}
        <div className="space-y-2 bg-white/70 dark:bg-neutral-900/60 p-4 rounded-2xl border border-rose-100 dark:border-rose-900/50">
          <div className="flex justify-between">
            <span className="text-dim">Cancellation Status:</span>
            <span className="font-bold text-rose-700 dark:text-rose-400">
              {orderStatus.replace(/_/g, " ")}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-dim">Cancellation Date:</span>
            <span className="font-semibold text-[#141416] dark:text-white">
              {cancelledAt ? new Date(cancelledAt).toLocaleString("en-IN") : "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-dim">Customer Reason:</span>
            <span className="font-semibold text-right max-w-[220px] text-[#141416] dark:text-white">
              {cancelReason || "Cancelled by customer"}
            </span>
          </div>
          {cancellationNotes && (
            <div className="pt-1.5 border-t border-rose-100 dark:border-rose-900/40">
              <span className="text-dim block mb-0.5">Customer Feedback:</span>
              <p className="text-[11px] italic text-[#141416] dark:text-white bg-black/5 dark:bg-white/5 p-2 rounded-lg">
                &quot;{cancellationNotes}&quot;
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Refund Status & Gateway Details */}
        <div className="space-y-2 bg-white/70 dark:bg-neutral-900/60 p-4 rounded-2xl border border-rose-100 dark:border-rose-900/50">
          <div className="flex justify-between">
            <span className="text-dim">Payment Method:</span>
            <span className="font-semibold text-[#141416] dark:text-white">
              {payment?.gatewayName || "Instant Online"} ({payment?.paymentChannel || "UPI / Card"})
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-dim">Refund Status:</span>
            <span
              className={`font-bold ${
                isRefundCompleted
                  ? "text-emerald-700 dark:text-emerald-400"
                  : payment?.refundStatus
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-dim"
              }`}
            >
              {payment?.refundStatus ? `✓ ${payment.refundStatus}` : isPrepaid ? "Pending Initiation" : "N/A (Zero Charge)"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-dim">Refund Amount:</span>
            <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-sm">
              {formatINR(refundAmount)}
            </span>
          </div>
          {payment?.refundId && (
            <div className="flex justify-between items-center pt-1">
              <span className="text-dim">Refund Ref ID:</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-[11px] bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded">
                  {payment.refundId}
                </span>
                <a
                  href={`https://dashboard.razorpay.com/app/refunds/${payment.refundId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0C3B2E] text-white hover:bg-[#144E3E]"
                  title="View Refund in Razorpay Dashboard"
                >
                  Razorpay ↗
                </a>
              </div>
            </div>
          )}
          {payment?.refundArn && (
            <div className="flex justify-between">
              <span className="text-dim">Bank ARN / RRN:</span>
              <span className="font-mono font-bold text-primary text-[11px]">
                {payment.refundArn}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Manual Refund Action Trigger for Admins (if not yet refunded) */}
      {isPrepaid && !hasRefund && (
        <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div>
            <p className="font-bold text-amber-900 dark:text-amber-200">
              ⚡ Action: Online Payment has not been refunded yet
            </p>
            <p className="text-amber-800/80 dark:text-amber-300 text-[11px]">
              Customer paid {formatINR(totalAmount)} via {payment?.paymentChannel || "Online Gateway"}. You can trigger the automated reversal directly to their bank account now.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowRefundModal(true)}
            className="px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider bg-amber-600 text-white hover:bg-amber-700 active:scale-95 transition-all shadow-sm shrink-0 cursor-pointer"
          >
            ⚡ Trigger Gateway Refund Now
          </button>
        </div>
      )}

      {/* Manual Refund Confirmation Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-[#E7DFD5] bg-white dark:bg-neutral-900 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <h3 className="font-display text-lg font-bold text-[#141416] dark:text-white">
              Process Gateway Refund
            </h3>
            <p className="text-xs text-dim leading-relaxed">
              This will immediately trigger an automated source-account refund of{" "}
              <strong className="text-primary font-bold">{formatINR(totalAmount)}</strong> via Razorpay back to the customer&apos;s bank / UPI ID.
            </p>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-dim mb-1">
                Refund Reason / Audit Note
              </label>
              <input
                type="text"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none focus:border-primary"
                style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => setShowRefundModal(false)}
                className="px-4 py-2 rounded-full border text-xs font-bold text-dim hover:text-text cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleTriggerRefund}
                className="px-5 py-2 rounded-full bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing Refund…</span>
                  </>
                ) : (
                  <span>Confirm &amp; Refund {formatINR(totalAmount)}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
