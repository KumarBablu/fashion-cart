"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/providers/ToastProvider";

export default function OrderDetailActions({
  orderId,
  status,
  isPaid,
}: {
  orderId: string;
  status: string;
  isPaid: boolean;
}) {
  const router = useRouter();
  const { success, error } = useToast();
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("Changed mind / ordered by mistake");

  const cancellable = ["PENDING_PAYMENT", "PAYMENT_REVIEW", "CONFIRMED", "PROCESSING"].includes(status);

  async function handleCancelOrder() {
    setCancelling(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason }),
      });

      const data = await res.json();
      if (res.ok) {
        success("Order Cancelled", "Your order has been cancelled and stock has been restored.");
        setShowCancelModal(false);
        router.refresh();
      } else {
        error("Cancellation Failed", data.error || "Could not cancel order.");
      }
    } catch {
      error("Error", "Network connection failed.");
    } finally {
      setCancelling(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        {/* Invoice Actions */}
        {isPaid ? (
          <div className="flex items-center gap-2">
            <a
              href={`/invoices/${orderId}`}
              target="_blank"
              className="px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider transition-all shadow-sm flex items-center gap-1.5 hover:brightness-105"
              style={{
                backgroundColor: "var(--fc-primary)",
                color: "var(--fc-primary-fg)",
              }}
            >
              <span>📄</span> View &amp; Print Tax Invoice
            </a>
            <a
              href={`/api/invoices/${orderId}`}
              download={`FashionCart-Tax-Invoice-${orderId}.pdf`}
              className="px-3.5 py-2 rounded-full font-bold text-xs uppercase tracking-wider bg-[#FFBA00] text-[#0C3B2E] hover:bg-[#EAA800] transition-all shadow-sm flex items-center gap-1"
            >
              <span>📥</span> PDF
            </a>
          </div>
        ) : null}

        <a
          href={`https://wa.me/919771039201?text=${encodeURIComponent(
            `Hello Fashion Cart! I need assistance with my Order ID: ${orderId}.`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3.5 py-2 rounded-full font-bold text-xs uppercase tracking-wider bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-sm flex items-center gap-1"
        >
          <span>💬</span> WhatsApp Support
        </a>

        {/* Cancel Order Button */}
        {cancellable && (
          <button
            onClick={() => setShowCancelModal(true)}
            className="px-4 py-2 rounded-full border text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors"
            style={{ borderColor: "rgba(244, 63, 94, 0.3)" }}
          >
            ✕ Cancel Order
          </button>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-4 flex items-center justify-center animate-in fade-in duration-200">
          <div
            onClick={() => setShowCancelModal(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
          />

          <div
            className="relative w-full max-w-md p-6 rounded-2xl border shadow-2xl z-10 animate-in zoom-in-95 duration-200 space-y-4"
            style={{
              backgroundColor: "var(--fc-surface)",
              borderColor: "var(--fc-border)",
              color: "var(--fc-text)",
            }}
          >
            <h3 className="font-display text-lg font-bold">Cancel Order</h3>
            <p className="text-xs text-dim">
              Are you sure you want to cancel this order? Reserved items will be released back to stock.
            </p>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-dim mb-1">
                Reason for cancellation
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border text-xs outline-none"
                style={{
                  backgroundColor: "var(--fc-bg)",
                  borderColor: "var(--fc-border)",
                }}
              >
                <option value="Changed mind / ordered by mistake">Changed mind / ordered by mistake</option>
                <option value="Need to change shipping address">Need to change shipping address</option>
                <option value="Found a better price elsewhere">Found a better price elsewhere</option>
                <option value="Ordered incorrect size or colour">Ordered incorrect size or colour</option>
                <option value="Other">Other reason</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 rounded-xl border text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5"
                style={{ borderColor: "var(--fc-border)" }}
              >
                Keep Order
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={handleCancelOrder}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {cancelling ? "Cancelling…" : "Confirm Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
