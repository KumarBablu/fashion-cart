"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/providers/ToastProvider";
import WhatsAppConciergeButton from "@/components/ui/WhatsAppConciergeButton";
import CancelOrderModal from "@/components/orders/CancelOrderModal";

export default function OrderDetailActions({
  orderId,
  orderNumber,
  status,
  isPaid,
  total,
  paymentMethod,
  isJewellery = false,
}: {
  orderId: string;
  orderNumber: string;
  status: string;
  isPaid: boolean;
  total: number;
  paymentMethod: string;
  isJewellery?: boolean;
}) {
  const router = useRouter();
  const { success } = useToast();
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    const store = isJewellery ? "jewellery" : "garments";
    sessionStorage.setItem("fc_active_store", store);
    document.cookie = `fc_store=${store}; path=/; max-age=31536000; SameSite=Lax`;
    window.dispatchEvent(new CustomEvent("store-switched", { detail: { store } }));
  }, [isJewellery]);

  const cancellable = ["PENDING_PAYMENT", "PAYMENT_REVIEW", "CONFIRMED", "PROCESSING"].includes(status);

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        {/* Complete Payment Button for Pending Orders */}
        {!isPaid && status === "PENDING_PAYMENT" && (
          <a
            href={`/checkout/${orderId}/payment${isJewellery ? "?store=jewellery" : ""}`}
            className="px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider bg-[#C59B27] text-white hover:bg-[#B0881E] transition-all shadow-md flex items-center gap-1.5"
          >
            <span>💳</span> Complete Payment Now
          </a>
        )}

        {/* Invoice Actions */}
        {isPaid ? (
          <div className="flex items-center gap-2">
            <a
              href={`/api/invoices/${orderId}`}
              download={`FashionCart-Tax-Invoice-${orderId}.pdf`}
              className="px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider bg-[#0C3B2E] text-white hover:bg-[#144E3E] transition-all shadow-sm flex items-center gap-1.5"
            >
              <span>📥</span> Download Tax Invoice (PDF)
            </a>
            <a
              href={`/invoices/${orderId}`}
              target="_blank"
              className="px-3.5 py-2 rounded-full font-bold text-xs uppercase tracking-wider border border-slate-300 text-slate-700 hover:bg-slate-100 transition-all shadow-xs flex items-center gap-1"
            >
              <span>👁️</span> View Receipt
            </a>
          </div>
        ) : null}

        <WhatsAppConciergeButton
          orderNumber={orderNumber}
          customMessage={`Hello Fashion Cart Support! I need assistance with my Order Reference #${orderNumber}.`}
          className="px-3.5 py-2 rounded-full font-bold text-xs uppercase tracking-wider bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-sm flex items-center gap-1 cursor-pointer"
        >
          <span>💬</span> WhatsApp Concierge
        </WhatsAppConciergeButton>

        {/* Cancel Order Button */}
        {cancellable && (
          <button
            onClick={() => setShowCancelModal(true)}
            className="px-4 py-2 rounded-full border text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
            style={{ borderColor: "rgba(244, 63, 94, 0.3)" }}
          >
            ✕ Cancel Order
          </button>
        )}
      </div>

      {/* Enhanced Cancellation Modal with Refund Destination Breakdown */}
      <CancelOrderModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onSuccess={() => {
          success("Order Cancelled", "Your order has been cancelled and stock returned to inventory.");
          router.refresh();
        }}
        orderId={orderId}
        orderNumber={orderNumber}
        total={total}
        paymentMethod={paymentMethod}
        isPrepaid={isPaid}
      />
    </>
  );
}
