import { formatINR } from "@/lib/format";

type OrderTrackingProps = {
  status: string;
  createdAt?: string | Date;
  carrierName?: string | null;
  trackingNumber?: string | null;
  paymentMethod?: string;
  total?: number | string;
};

const STAGES = [
  {
    key: "PAYMENT",
    title: "Payment Verification",
    desc: "Awaiting payment proof and billing verification.",
    icon: "⏳",
  },
  {
    key: "CONFIRMED",
    title: "Order Confirmed",
    desc: "Payment verified. Your order is officially confirmed.",
    icon: "✓",
  },
  {
    key: "PROCESSING",
    title: "Order Processing",
    desc: "Our master tailors and team are preparing your package.",
    icon: "📦",
  },
  {
    key: "SHIPPED",
    title: "Shipped & In Transit",
    desc: "Handed over to courier logistics partner.",
    icon: "🚚",
  },
  {
    key: "OUT_FOR_DELIVERY",
    title: "Out for Delivery",
    desc: "Our delivery agent is arriving at your doorstep today.",
    icon: "🛵",
  },
  {
    key: "DELIVERED",
    title: "Delivered",
    desc: "Package delivered to recipient successfully.",
    icon: "🎁",
  },
];

function getStageIndex(status: string): number {
  switch (status) {
    case "PENDING_PAYMENT":
    case "PAYMENT_REVIEW":
      return 0;
    case "CONFIRMED":
      return 1;
    case "PROCESSING":
    case "PACKED":
      return 2;
    case "SHIPPED":
      return 3;
    case "OUT_FOR_DELIVERY":
      return 4;
    case "DELIVERED":
      return 5;
    default:
      return 0;
  }
}

export default function OrderTracking({
  status,
  createdAt,
  carrierName,
  trackingNumber,
  paymentMethod,
  total,
}: OrderTrackingProps) {
  const isCancelled = status === "CANCELLED" || status === "REFUND_PENDING" || status === "REFUNDED";

  if (isCancelled) {
    return (
      <div
        className="p-6 rounded-2xl border space-y-3"
        style={{
          backgroundColor: "rgba(244, 63, 94, 0.08)",
          borderColor: "rgba(244, 63, 94, 0.3)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🚫</span>
          <h3 className="font-bold text-sm text-rose-500 uppercase tracking-wide">
            {status === "CANCELLED" ? "Order Cancelled" : status === "REFUND_PENDING" ? "Refund In Process" : "Order Refunded"}
          </h3>
        </div>
        <p className="text-xs text-dim leading-relaxed">
          {status === "CANCELLED"
            ? "This order was cancelled. Reserved items have been returned to stock. If you were charged, a refund is processed to your original payment method."
            : "Your refund request is being handled by our billing desk."}
        </p>
      </div>
    );
  }

  const activeIndex = getStageIndex(status);
  const isDelivered = status === "DELIVERED";

  // Estimated delivery calculation (3 days from order date)
  const orderDate = createdAt ? new Date(createdAt) : new Date();
  const estDate = new Date(orderDate);
  estDate.setDate(estDate.getDate() + 4);
  const formattedEstDate = estDate.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  const isPendingPaymentAction = status === "PENDING_PAYMENT";
  const isUnderReview = status === "PAYMENT_REVIEW";

  return (
    <div className="space-y-6">
      {/* Dynamic Status / Delivery Banner */}
      {isPendingPaymentAction ? (
        <div className="p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-500/10 border-amber-500/30">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⏳</span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Action Required · Payment Incomplete
              </p>
              <p className="text-sm font-bold mt-0.5" style={{ color: "var(--fc-text)" }}>
                Payment has not been completed yet. Please complete payment to confirm your order and initiate shipment.
              </p>
            </div>
          </div>
        </div>
      ) : isUnderReview ? (
        <div className="p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-sky-500/10 border-sky-500/30">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔍</span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                Payment Verification in Progress
              </p>
              <p className="text-sm font-bold mt-0.5" style={{ color: "var(--fc-text)" }}>
                Your payment proof is being verified by our billing desk. Delivery fulfillment will begin once confirmed.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          style={{
            backgroundColor: isDelivered ? "rgba(34, 197, 94, 0.1)" : "var(--fc-bg)",
            borderColor: isDelivered ? "rgba(34, 197, 94, 0.3)" : "var(--fc-border)",
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{isDelivered ? "🎉" : "🚚"}</span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-primary">
                {isDelivered ? "Successfully Delivered" : "Expected Delivery Date"}
              </p>
              <p className="text-sm font-bold mt-0.5" style={{ color: "var(--fc-text)" }}>
                {isDelivered ? "Delivered to your address" : `Arriving by ${formattedEstDate}`}
              </p>
            </div>
          </div>

          {trackingNumber && (
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold border" style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}>
                AWB: {trackingNumber}
              </span>
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(`${carrierName || "Courier"} tracking ${trackingNumber}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white shadow-xs"
                style={{ backgroundColor: "var(--fc-primary)" }}
              >
                Track Live ↗
              </a>
            </div>
          )}
        </div>
      )}

      {/* Flipkart-Style Vertical / Stepper Timeline */}
      <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-300 dark:before:bg-slate-700">
        {STAGES.map((stage, idx) => {
          const isPendingPayment = status === "PENDING_PAYMENT" || status === "PAYMENT_REVIEW";
          const isDone = isPendingPayment ? false : idx <= activeIndex;
          const isCurrent = idx === activeIndex && !isDelivered;

          // Dynamic title & description for payment stage
          let stageTitle = stage.title;
          let stageDesc = stage.desc;

          if (stage.key === "PAYMENT") {
            if (status === "PENDING_PAYMENT") {
              stageTitle = "Payment Pending";
              stageDesc = "Payment not yet received. Please complete payment to confirm your order.";
            } else if (status === "PAYMENT_REVIEW") {
              stageTitle = "Payment Under Review";
              stageDesc = "Payment proof submitted. Our billing desk is verifying your transaction.";
            } else {
              stageTitle = "Payment Verified";
              stageDesc = "Payment received and verified successfully.";
            }
          }

          return (
            <div key={stage.key} className="relative flex items-start gap-4">
              {/* Stepper Node Icon */}
              <div
                className={`absolute -left-6 sm:-left-8 top-0.5 h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all shadow-sm ${
                  isDone
                    ? "bg-emerald-500 text-white ring-4 ring-emerald-500/20"
                    : isCurrent
                    ? "bg-primary text-white ring-4 ring-primary/30 animate-pulse"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-400 border border-slate-300 dark:border-slate-700"
                }`}
                style={isDone ? { backgroundColor: "#22c55e" } : isCurrent ? { backgroundColor: "var(--fc-primary)" } : {}}
              >
                {isDone ? "✓" : idx + 1}
              </div>

              {/* Stage Content Card */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4
                    className={`text-xs sm:text-sm font-bold ${
                      isDone ? "text-emerald-600 dark:text-emerald-400" : isCurrent ? "text-primary" : "text-dim"
                    }`}
                  >
                    {stageTitle}
                  </h4>
                  {isCurrent && (
                    <span className="px-2 py-0.2 rounded-full text-[9px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                      Current Status
                    </span>
                  )}
                </div>
                <p className="text-xs text-dim leading-relaxed">{stageDesc}</p>

                {/* Additional context for shipped status */}
                {stage.key === "SHIPPED" && carrierName && (
                  <p className="text-[11px] font-semibold text-primary pt-0.5">
                    Courier Partner: {carrierName} {trackingNumber ? `· Tracking: ${trackingNumber}` : ""}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
