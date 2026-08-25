"use client";

import { formatINR } from "@/lib/format";
import WhatsAppConciergeButton from "@/components/ui/WhatsAppConciergeButton";

type CancellationTrackingProps = {
  orderNumber: string;
  total: number;
  paymentMethod: string;
  cancelledAt?: string | Date | null;
  cancelReason?: string | null;
  cancellationNotes?: string | null;
  payment?: {
    status: string;
    gatewayName?: string | null;
    paymentChannel?: string | null;
    instrumentDetails?: string | null;
    utrNumber?: string | null;
    refundId?: string | null;
    refundStatus?: string | null;
    refundAmount?: number | null;
    refundArn?: string | null;
    refundSpeed?: string | null;
    refundCreatedAt?: string | Date | null;
    refundCompletedAt?: string | Date | null;
  } | null;
};

export default function CancellationTracking({
  orderNumber,
  total,
  paymentMethod,
  cancelledAt,
  cancelReason,
  cancellationNotes,
  payment,
}: CancellationTrackingProps) {
  const isPrepaid = payment?.status === "VERIFIED" || Boolean(payment?.refundId) || paymentMethod.includes("ONLINE");
  const isCOD = paymentMethod === "COD";

  const cancelDate = cancelledAt ? new Date(cancelledAt) : new Date();
  const formattedCancelDate = cancelDate.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const refundAmount = payment?.refundAmount ? Number(payment.refundAmount) : total;
  const isRefundProcessed = payment?.refundStatus === "PROCESSED" || Boolean(payment?.refundCompletedAt);

  // Stepper milestones
  const steps = [
    {
      title: "Cancellation Requested",
      desc: cancelReason || "Customer requested order cancellation",
      time: formattedCancelDate,
      isDone: true,
      icon: "📝",
    },
    {
      title: "Cancellation Approved & Stock Restocked",
      desc: "Order voided and reserved items returned to boutique inventory.",
      time: formattedCancelDate,
      isDone: true,
      icon: "📦",
    },
    {
      title: isPrepaid ? "Refund Initiated via Secure Gateway" : "Cancellation Finalized (Zero Fee)",
      desc: isPrepaid
        ? `Full refund of ${formatINR(refundAmount)} triggered to your original payment method.`
        : "No payment was collected for this Cash on Delivery order.",
      time: payment?.refundCreatedAt
        ? new Date(payment.refundCreatedAt).toLocaleString("en-IN", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })
        : formattedCancelDate,
      isDone: true,
      icon: isPrepaid ? "⚡" : "✓",
    },
    {
      title: isPrepaid ? "Credited to Bank Account" : "Order Lifecycle Closed",
      desc: isPrepaid
        ? isRefundProcessed
          ? "Refund successfully processed by banking network. Check your account statement."
          : "In transit with banking network. Expected in 2–24h for UPI or 3–5 working days for Cards."
        : "Order is closed with zero charges or liability.",
      time: isRefundProcessed && payment?.refundCompletedAt
        ? new Date(payment.refundCompletedAt).toLocaleString("en-IN", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })
        : isPrepaid
        ? "Processing with Bank"
        : formattedCancelDate,
      isDone: isPrepaid ? isRefundProcessed : true,
      isCurrent: isPrepaid && !isRefundProcessed,
      icon: "🏦",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-3xl border border-rose-200 dark:border-rose-900 bg-rose-50/70 dark:bg-rose-950/30 space-y-2 text-left">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🚫</span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-400">
                Order Cancelled
              </p>
              <h3 className="font-display text-base font-bold text-[#141416] dark:text-white">
                Cancellation &amp; Refund Progress Desk
              </h3>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-200/80 dark:bg-rose-900 text-rose-900 dark:text-rose-100">
            #{orderNumber}
          </span>
        </div>

        <p className="text-xs text-rose-900/80 dark:text-rose-200/80 leading-relaxed pt-1">
          {isPrepaid
            ? `Your cancellation is complete. A full refund of ${formatINR(refundAmount)} is on its way to your original source account.`
            : "Your order was successfully cancelled with zero fees. No amount was deducted."}
        </p>
      </div>

      {/* Refund Breakdown Card (Prepaid only) */}
      {isPrepaid && (
        <div
          className="p-5 rounded-3xl border space-y-3.5 text-left"
          style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}
        >
          <div className="flex items-center justify-between border-b pb-2.5" style={{ borderColor: "var(--fc-border)" }}>
            <span className="text-xs font-bold uppercase tracking-wider text-dim">Refund Breakdown</span>
            <span className="text-xs font-black font-display text-emerald-600 dark:text-emerald-400">
              {formatINR(refundAmount)} (100% Refund)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-dim">Refund Destination:</span>
                <span className="font-semibold text-right">
                  {payment?.instrumentDetails || payment?.paymentChannel || "Original Source Account"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-dim">Refund Status:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {payment?.refundStatus ? `✓ ${payment.refundStatus}` : "✓ INITIATED"}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 sm:border-l sm:pl-3" style={{ borderColor: "var(--fc-border)" }}>
              {payment?.refundId && (
                <div className="flex justify-between">
                  <span className="text-dim">Refund Ref ID:</span>
                  <span className="font-mono font-bold text-[11px] bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded">
                    {payment.refundId}
                  </span>
                </div>
              )}
              {payment?.refundArn && (
                <div className="flex justify-between">
                  <span className="text-dim">Bank ARN / RRN:</span>
                  <span className="font-mono font-bold text-[11px] text-primary">
                    {payment.refundArn}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-dim">Estimated Credit:</span>
                <span className="font-semibold text-primary">
                  {payment?.paymentChannel === "UPI" ? "Within 2–24 Hours" : "3–5 Business Days"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progressive 4-Stage Stepper Timeline */}
      <div className="p-6 rounded-3xl border text-left space-y-5" style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}>
        <h4 className="text-xs font-extrabold uppercase tracking-wider text-dim">
          Milestone Timeline
        </h4>

        <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-neutral-700">
          {steps.map((step, idx) => {
            return (
              <div key={idx} className="relative flex items-start gap-3.5">
                {/* Stepper Node */}
                <div
                  className={`absolute -left-6 sm:-left-8 top-0.5 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-xs ${
                    step.isDone
                      ? "bg-emerald-600 text-white ring-4 ring-emerald-500/20"
                      : step.isCurrent
                      ? "bg-amber-500 text-white ring-4 ring-amber-500/20 animate-pulse"
                      : "bg-neutral-200 dark:bg-neutral-800 text-neutral-400"
                  }`}
                >
                  {step.isDone ? "✓" : idx + 1}
                </div>

                {/* Content */}
                <div className="space-y-0.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className={`text-xs sm:text-sm font-bold ${step.isDone ? "text-emerald-700 dark:text-emerald-400" : "text-[#141416] dark:text-white"}`}>
                      {step.title}
                    </p>
                    <span className="text-[10px] text-dim font-mono">{step.time}</span>
                  </div>
                  <p className="text-xs text-dim leading-relaxed">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Customer Concierge Support Help */}
      <div className="p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#FAF8F5] dark:bg-neutral-900/50" style={{ borderColor: "var(--fc-border)" }}>
        <div className="flex items-center gap-3">
          <span className="text-xl">💬</span>
          <div className="text-left text-xs">
            <p className="font-bold text-[#141416] dark:text-white">Need assistance with your cancellation?</p>
            <p className="text-dim text-[11px]">Our boutique concierge is ready to assist you via WhatsApp or Email.</p>
          </div>
        </div>
        <WhatsAppConciergeButton
          className="px-4 py-2 rounded-full text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-xs cursor-pointer"
          customMessage={`Hello Fashion Cart Support, I have a question regarding the cancellation & refund of my Order #${orderNumber}.`}
        >
          Chat with Concierge →
        </WhatsAppConciergeButton>
      </div>
    </div>
  );
}
