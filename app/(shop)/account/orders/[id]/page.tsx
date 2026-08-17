import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { formatINR } from "@/lib/format";
import OrderTracking from "@/components/account/OrderTracking";
import OrderDetailActions from "@/components/account/OrderDetailActions";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/account/orders/${id}`)}`);
  }

  const order = await prisma.order.findFirst({
    where: {
      id,
      OR: [
        { userId: user.id },
        { user: { email: user.email } },
      ],
    },
    include: { items: true, payment: true, invoice: true },
  });

  if (!order) notFound();

  const addr = order.shippingAddressSnapshot as {
    fullName: string;
    mobileNumber: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pinCode: string;
    landmark?: string;
  };

  const isPaid = order.payment?.status === "VERIFIED" || order.status === "CONFIRMED" || order.status === "DELIVERED";

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl border" style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-2xl font-bold">{order.orderNumber}</h2>
            <span
              className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
              style={{
                backgroundColor: order.status === "DELIVERED" || order.status === "CONFIRMED"
                  ? "rgba(34, 197, 94, 0.15)"
                  : order.status === "CANCELLED"
                  ? "rgba(244, 63, 94, 0.15)"
                  : "var(--fc-badge-bg)",
                color: order.status === "DELIVERED" || order.status === "CONFIRMED"
                  ? "#22c55e"
                  : order.status === "CANCELLED"
                  ? "#f43f5e"
                  : "var(--fc-badge-fg)",
              }}
            >
              {order.status.replace(/_/g, " ")}
            </span>
          </div>
          <p className="text-xs text-dim mt-1">
            Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        <OrderDetailActions
          orderId={order.id}
          status={order.status}
          isPaid={isPaid}
        />
      </div>

      {/* Visual Tracking Timeline */}
      <div className="p-6 rounded-2xl border shadow-sm" style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-base font-bold">Delivery &amp; Fulfillment Progress</h3>
          <span className="text-xs text-dim">Order #{order.orderNumber}</span>
        </div>
        <OrderTracking
          status={order.status}
          createdAt={order.createdAt}
          carrierName={order.carrierName}
          trackingNumber={order.trackingNumber}
          paymentMethod={order.paymentMethod}
          total={Number(order.total)}
        />
      </div>

      {/* Ordered Items Table */}
      <div className="p-6 rounded-2xl border" style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}>
        <h3 className="font-display text-base font-bold mb-3">Order Items</h3>
        <div className="divide-y" style={{ borderColor: "var(--fc-border)" }}>
          {order.items.map((item) => (
            <div key={item.id} className="flex flex-wrap justify-between items-center py-3 text-sm gap-2">
              <div>
                <p className="font-semibold">{item.productNameSnapshot}</p>
                <p className="text-xs text-dim mt-0.5">
                  SKU: {item.skuSnapshot} · {item.colourSnapshot} / {item.sizeSnapshot} · Qty: {item.quantity}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {order.status === "DELIVERED" && (
                  <Link
                    href={`/shop`}
                    className="px-3 py-1 rounded-full border border-[#FFBA00] text-[11px] font-bold text-[#0C3B2E] bg-[#FFF7E0] hover:bg-[#FFBA00] transition-colors"
                  >
                    ⭐ Write Review
                  </Link>
                )}
                <span className="font-bold">{formatINR(item.total)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Pricing Summary */}
        <div className="mt-4 border-t pt-4 space-y-2 text-xs" style={{ borderColor: "var(--fc-border)" }}>
          <div className="flex justify-between text-dim">
            <span>Items Subtotal</span>
            <span>{formatINR(order.subtotal)}</span>
          </div>
          {Number(order.discount) > 0 && (
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
              <span>Coupon Discount {order.couponCode ? `(${order.couponCode})` : ""}</span>
              <span>- {formatINR(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-dim">
            <span>Delivery & Shipping</span>
            <span>{Number(order.deliveryCharge) === 0 ? "FREE" : formatINR(order.deliveryCharge)}</span>
          </div>
          <div className="flex justify-between text-dim">
            <span>Estimated Taxes (GST)</span>
            <span>{formatINR(order.tax)}</span>
          </div>
          <div className="flex justify-between text-sm font-bold pt-2 border-t" style={{ borderColor: "var(--fc-border)" }}>
            <span>Grand Total</span>
            <span className="text-base text-primary">{formatINR(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Address & Payment Info */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="p-6 rounded-2xl border" style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}>
          <h3 className="font-display text-base font-bold mb-3">Delivery Address</h3>
          <p className="text-xs text-dim leading-relaxed">
            <strong className="text-sm font-semibold text-primary block mb-1" style={{ color: "var(--fc-text)" }}>
              {addr.fullName}
            </strong>
            {addr.addressLine1}
            {addr.addressLine2 ? `, ${addr.addressLine2}` : ""}<br />
            {addr.city}, {addr.state} - {addr.pinCode}<br />
            {addr.landmark ? `Landmark: ${addr.landmark}` : ""}<br />
            Phone: {addr.mobileNumber}
          </p>
        </div>

        <div className="p-6 rounded-2xl border" style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}>
          <h3 className="font-display text-base font-bold mb-3">Payment Details</h3>
          <div className="space-y-1.5 text-xs text-dim">
            <p>
              <strong className="font-semibold" style={{ color: "var(--fc-text)" }}>Method: </strong>
              {order.paymentMethod.replace(/_/g, " ")}
            </p>
            <p>
              <strong className="font-semibold" style={{ color: "var(--fc-text)" }}>Payment Status: </strong>
              <span className="font-bold text-primary">{order.payment?.status.replace(/_/g, " ")}</span>
            </p>
            {order.payment?.utrNumber && (
              <p>
                <strong className="font-semibold" style={{ color: "var(--fc-text)" }}>UTR / Ref No: </strong>
                <span className="font-mono">{order.payment.utrNumber}</span>
              </p>
            )}
            {order.payment?.rejectionReason && (
              <p className="text-rose-500 font-semibold">
                Reason: {order.payment.rejectionReason}
              </p>
            )}

            {(order.payment?.status === "PAYMENT_PENDING" || order.payment?.status === "REJECTED") && order.paymentMethod === "MANUAL_UPI" && (
              <div className="pt-3">
                <Link
                  href={`/checkout/${order.id}/payment`}
                  className="inline-block px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider text-white"
                  style={{ backgroundColor: "var(--fc-primary)" }}
                >
                  {order.payment?.status === "REJECTED" ? "Resubmit Payment Proof →" : "Complete UPI Payment →"}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
