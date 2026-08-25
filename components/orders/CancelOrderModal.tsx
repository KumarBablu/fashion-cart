"use client";

import { useState } from "react";
import { formatINR } from "@/lib/format";

type CancelOrderModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  orderId: string;
  orderNumber: string;
  total: number;
  paymentMethod: string;
  isPrepaid: boolean;
};

const CANCEL_REASONS = [
  "Ordered by mistake / Accidental purchase",
  "Need to update delivery address or mobile number",
  "Incorrect size, colour, or variant chosen",
  "Expected earlier delivery / Change in event date",
  "Found alternative item or better deal",
  "Placed duplicate order by mistake",
  "Decided to buy later / Other reason",
];

export default function CancelOrderModal({
  isOpen,
  onClose,
  onSuccess,
  orderId,
  orderNumber,
  total,
  paymentMethod,
  isPrepaid,
}: CancelOrderModalProps) {
  const [selectedReason, setSelectedReason] = useState(CANCEL_REASONS[0]);
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleConfirmCancel() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: selectedReason,
          notes: additionalNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error || "Could not cancel order. Please try again.");
        return;
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setLoading(false);
      setError(err.message || "Network error while cancelling order.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl border border-[#E7DFD5] bg-white dark:bg-neutral-900 shadow-2xl p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#E7DFD5] dark:border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center text-xl shrink-0">
              ✕
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-[#141416] dark:text-white">
                Cancel Order #{orderNumber}
              </h2>
              <p className="text-xs text-[#787C87]">
                Total Amount: <strong className="text-primary font-mono">{formatINR(total)}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[#787C87] text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Informative Notice Banner */}
        <div className="p-3.5 rounded-2xl bg-[#FAF8F5] dark:bg-neutral-800/80 border border-[#E7DFD5] dark:border-neutral-700 text-xs space-y-1.5">
          <p className="font-bold text-[#141416] dark:text-white flex items-center gap-1.5">
            <span>🛡️</span> Refund &amp; Cancellation Terms
          </p>
          <p className="text-[#5A5E69] dark:text-neutral-300 text-[11px] leading-relaxed">
            {isPrepaid ? (
              <>
                A full refund of <strong>{formatINR(total)}</strong> will be automatically initiated to your <strong>original payment source (UPI / Card)</strong> upon cancellation.
              </>
            ) : paymentMethod === "COD" ? (
              <>
                No payment was collected for this Cash on Delivery order. Your order will be cancelled immediately with <strong>zero penalty</strong>.
              </>
            ) : (
              <>
                Your order will be cancelled immediately and reserved boutique items returned to stock.
              </>
            )}
          </p>
        </div>

        {/* Reason Selector */}
        <div className="space-y-2 text-left">
          <label className="block text-xs font-bold text-[#141416] dark:text-white uppercase tracking-wider">
            Reason for Cancellation <span className="text-rose-500">*</span>
          </label>
          <select
            value={selectedReason}
            onChange={(e) => setSelectedReason(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9D0C5] dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-semibold text-[#141416] dark:text-white outline-none focus:border-primary cursor-pointer"
          >
            {CANCEL_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* Additional Optional Feedback */}
        <div className="space-y-1.5 text-left">
          <label className="block text-[11px] font-bold text-[#787C87] uppercase tracking-wider">
            Additional Comments (Optional)
          </label>
          <textarea
            rows={2}
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            placeholder="Let us know how we can improve your shopping experience…"
            className="w-full px-3.5 py-2 rounded-xl border border-[#D9D0C5] dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-[#141416] dark:text-white outline-none focus:border-primary"
          />
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="px-4 py-2 rounded-full border border-[#D9D0C5] dark:border-neutral-700 text-xs font-bold text-[#787C87] hover:text-[#141416] hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            Keep Order
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleConfirmCancel}
            className="px-6 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 active:scale-95 text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing Cancellation…</span>
              </>
            ) : (
              <span>Confirm Cancellation</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
