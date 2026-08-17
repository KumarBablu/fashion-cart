import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatINR } from "@/lib/format";
import OrderStatusSelect from "@/components/admin/OrderStatusSelect";
import PaymentVerifyPanel from "@/components/admin/PaymentVerifyPanel";
import OrderFulfillmentManager from "@/components/admin/OrderFulfillmentManager";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { user: true, items: true, payment: true, invoice: true },
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

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-2xl border" style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold">{order.orderNumber}</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase" style={{ backgroundColor: "var(--fc-badge-bg)", color: "var(--fc-badge-fg)" }}>
              {order.status.replace(/_/g, " ")}
            </span>
          </div>
          <p className="text-xs text-dim mt-1">
            Customer: <strong style={{ color: "var(--fc-text)" }}>{order.user.name}</strong> ({order.user.email}) · Placed on {new Date(order.createdAt).toLocaleDateString("en-IN")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`/invoices/${order.id}`}
            target="_blank"
            className="px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider text-white shadow-sm flex items-center gap-1.5 hover:brightness-105"
            style={{ backgroundColor: "var(--fc-primary)" }}
          >
            <span>📄</span> Tax Invoice / Receipt
          </a>
          <a
            href={`/invoices/${order.id}`}
            target="_blank"
            className="px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider bg-[#FFBA00] text-[#0C3B2E] shadow-sm flex items-center gap-1.5 hover:bg-[#EAA800]"
          >
            <span>📦</span> Print Parcel Label (4×6)
          </a>
          <OrderStatusSelect orderId={order.id} currentStatus={order.status} />
        </div>
      </div>

      {/* Fulfillment & Tracking Section */}
      <div className="p-6 rounded-2xl border space-y-3" style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}>
        <h2 className="font-display text-base font-bold">Shipping & Logistics Fulfillment</h2>
        <p className="text-xs text-dim">Add courier name and tracking ID to notify customer timeline.</p>
        <OrderFulfillmentManager
          orderId={order.id}
          initialCarrier={order.carrierName}
          initialTracking={order.trackingNumber}
        />
      </div>

      {/* Items Section */}
      <div className="p-6 rounded-2xl border" style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}>
        <h2 className="font-display text-base font-bold mb-3">Purchased Items ({order.items.length})</h2>
        <div className="divide-y text-xs" style={{ borderColor: "var(--fc-border)" }}>
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between items-center py-2.5">
              <div>
                <p className="font-bold text-sm">{item.productNameSnapshot}</p>
                <p className="text-dim mt-0.5">
                  SKU: {item.skuSnapshot} · {item.colourSnapshot} / {item.sizeSnapshot} · Qty: {item.quantity} × {formatINR(item.unitPrice)}
                </p>
              </div>
              <span className="font-bold text-sm">{formatINR(item.total)}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 border-t pt-3 space-y-1.5 text-xs" style={{ borderColor: "var(--fc-border)" }}>
          <div className="flex justify-between text-dim"><span>Subtotal</span><span>{formatINR(order.subtotal)}</span></div>
          {Number(order.discount) > 0 && (
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
              <span>Coupon Discount ({order.couponCode || "PROMO"})</span>
              <span>- {formatINR(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-dim"><span>Delivery Fee</span><span>{formatINR(order.deliveryCharge)}</span></div>
          <div className="flex justify-between text-dim"><span>Taxes</span><span>{formatINR(order.tax)}</span></div>
          <div className="flex justify-between text-sm font-bold pt-2 border-t" style={{ borderColor: "var(--fc-border)" }}>
            <span>Order Total</span>
            <span className="text-primary text-base">{formatINR(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Address & Payment Row */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="p-6 rounded-2xl border space-y-2" style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}>
          <h2 className="font-display text-base font-bold">Shipping Address</h2>
          <p className="text-xs text-dim leading-relaxed">
            <strong className="block text-sm font-bold mb-1" style={{ color: "var(--fc-text)" }}>{addr.fullName}</strong>
            {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ""}<br />
            {addr.city}, {addr.state} - {addr.pinCode}<br />
            {addr.landmark ? `Landmark: ${addr.landmark}` : ""}<br />
            Mobile: {addr.mobileNumber}
          </p>
          {order.customerNotes && (
            <div className="pt-2 border-t text-xs" style={{ borderColor: "var(--fc-border)" }}>
              <p className="font-bold text-primary">Customer Note:</p>
              <p className="text-dim italic mt-0.5">&quot;{order.customerNotes}&quot;</p>
            </div>
          )}
        </div>

        {order.payment && (
          <div className="p-6 rounded-2xl border space-y-3" style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}>
            <h2 className="font-display text-base font-bold">Payment Verification Desk</h2>
            <PaymentVerifyPanel
              payment={{
                id: order.payment.id,
                status: order.payment.status,
                amount: Number(order.payment.amount),
                utrNumber: order.payment.utrNumber,
                screenshotPath: order.payment.screenshotPath,
                submittedAt: order.payment.submittedAt?.toISOString() ?? null,
                rejectionReason: order.payment.rejectionReason,
                orderId: order.id,
                orderNumber: order.orderNumber,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
