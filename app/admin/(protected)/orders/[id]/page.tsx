import { notFound } from "next/navigation";
import { formatINR } from "@/lib/format";
import OrderStatusSelect from "@/components/admin/OrderStatusSelect";
import PaymentVerifyPanel from "@/components/admin/PaymentVerifyPanel";
import OrderFulfillmentManager from "@/components/admin/OrderFulfillmentManager";
import OrderEmailReachoutModal from "@/components/admin/OrderEmailReachoutModal";
import AdminRefundManager from "@/components/admin/AdminRefundManager";
import WhatsAppConciergeButton from "@/components/ui/WhatsAppConciergeButton";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { getDb } = await import("@/lib/db");
  let store: "garments" | "jewellery" = "garments";
  let order = await getDb("garments").order.findUnique({
    where: { id },
    include: {
      user: true,
      items: {
        include: {
          product: {
            include: { seller: true },
          },
        },
      },
      payment: true,
      invoice: true,
      shipment: {
        include: {
          activities: { orderBy: { timestamp: "desc" } },
          pickupLocation: true,
        },
      },
    },
  });

  if (!order) {
    order = await getDb("jewellery").order.findUnique({
      where: { id },
      include: {
        user: true,
        items: {
          include: {
            product: {
              include: { seller: true },
            },
          },
        },
        payment: true,
        invoice: true,
        shipment: {
          include: {
            activities: { orderBy: { timestamp: "desc" } },
            pickupLocation: true,
          },
        },
      },
    });
    if (order) {
      store = "jewellery";
    }
  }

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
    <div className="h-full overflow-y-auto min-h-0 max-w-4xl space-y-6 pr-1 pb-16">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-2xl border" style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold">{order.orderNumber}</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase" style={{ backgroundColor: "var(--fc-badge-bg)", color: "var(--fc-badge-fg)" }}>
              {order.status.replace(/_/g, " ")}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase bg-black/5 dark:bg-white/10">
              {store === "jewellery" ? "💍 Jewellery" : "👗 Garments"}
            </span>
          </div>
          <p className="text-xs text-dim mt-1">
            Customer: <strong style={{ color: "var(--fc-text)" }}>{order.user.name}</strong> ({order.user.email}) · Placed on {new Date(order.createdAt).toLocaleDateString("en-IN")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <OrderEmailReachoutModal
            orderId={order.id}
            orderNumber={order.orderNumber}
            customerName={order.user.name}
            customerEmail={order.user.email}
            orderStatus={order.status}
            paymentStatus={order.payment?.status}
            totalAmount={Number(order.total)}
            items={order.items.map((it) => ({
              name: it.productNameSnapshot,
              quantity: it.quantity,
              size: it.sizeSnapshot || undefined,
              price: Number(it.unitPrice),
            }))}
            store={store}
            mobileNumber={addr?.mobileNumber}
          />
          {addr?.mobileNumber && (
            <a
              href={`https://wa.me/${addr.mobileNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                `Hello ${addr.fullName}, this is Fashion Cart Concierge regarding your Order #${order.orderNumber}.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-[#25D366] text-white hover:bg-[#1EBE5D] transition-all shadow-xs cursor-pointer"
            >
              <span>💬</span> WhatsApp Customer
            </a>
          )}
          <OrderStatusSelect orderId={order.id} currentStatus={order.status} />
        </div>
      </div>

      {/* Cancellation & Refund Management Desk (Top Priority) */}
      <AdminRefundManager
        orderId={order.id}
        orderNumber={order.orderNumber}
        orderStatus={order.status}
        totalAmount={Number(order.total)}
        cancelledAt={order.cancelledAt || order.cancelRequestedAt}
        cancelReason={order.cancelReason}
        cancellationNotes={order.cancellationNotes}
        payment={
          order.payment
            ? {
                id: order.payment.id,
                status: order.payment.status,
                amount: Number(order.payment.amount),
                utrNumber: order.payment.utrNumber,
                gatewayName: order.payment.gatewayName,
                paymentChannel: order.payment.paymentChannel,
                instrumentDetails: order.payment.instrumentDetails,
                refundId: order.payment.refundId,
                refundStatus: order.payment.refundStatus,
                refundAmount: order.payment.refundAmount ? Number(order.payment.refundAmount) : null,
                refundArn: order.payment.refundArn,
                refundSpeed: order.payment.refundSpeed,
                refundCreatedAt: order.payment.refundCreatedAt?.toISOString() ?? null,
                refundCompletedAt: order.payment.refundCompletedAt?.toISOString() ?? null,
              }
            : null
        }
      />

      {/* Logistics & Courier Fulfillment Panel */}
      <OrderFulfillmentManager
        orderId={order.id}
        orderNumber={order.orderNumber}
        orderStatus={order.status}
        store={store}
        initialCarrier={order.carrierName}
        initialTracking={order.trackingNumber}
        shipment={
          order.shipment
            ? {
                id: order.shipment.id,
                carrierName: order.shipment.carrierName,
                awbNumber: order.shipment.awbNumber,
                status: order.shipment.status,
                statusDescription: order.shipment.statusDescription,
                routingCode: order.shipment.routingCode,
                packageWeightKg: Number(order.shipment.packageWeightKg),
                shippingCost: order.shipment.shippingCost ? Number(order.shipment.shippingCost) : null,
                pickupToken: order.shipment.pickupToken,
                pickupScheduledDate: order.shipment.pickupScheduledDate?.toISOString() ?? null,
                estimatedDelivery: order.shipment.estimatedDelivery?.toISOString() ?? null,
                activities: order.shipment.activities.map((act) => ({
                  id: act.id,
                  status: act.status,
                  location: act.location,
                  description: act.description,
                  timestamp: act.timestamp.toISOString(),
                })),
              }
            : null
        }
      />

      {/* Ordered Items Table */}
      <div className="p-6 rounded-2xl border space-y-4" style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-bold">Ordered Items &amp; Pricing</h2>
          <span className="text-xs text-dim">{order.items.length} unique item(s)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b text-left text-dim uppercase" style={{ borderColor: "var(--fc-border)" }}>
                <th className="pb-2">Product Name</th>
                <th className="pb-2">SKU</th>
                <th className="pb-2">Size / Colour</th>
                <th className="pb-2">Qty</th>
                <th className="pb-2 text-right">Unit Price</th>
                <th className="pb-2 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "var(--fc-border)" }}>
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td className="py-2.5 font-bold" style={{ color: "var(--fc-text)" }}>{item.productNameSnapshot}</td>
                  <td className="py-2.5 font-mono text-dim">{item.skuSnapshot}</td>
                  <td className="py-2.5">{item.sizeSnapshot} / {item.colourSnapshot}</td>
                  <td className="py-2.5 font-semibold">{item.quantity}</td>
                  <td className="py-2.5 text-right">{formatINR(item.unitPrice)}</td>
                  <td className="py-2.5 text-right font-bold text-primary">{formatINR(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pricing Breakdown */}
        <div className="space-y-1.5 text-xs pt-3 border-t max-w-xs ml-auto" style={{ borderColor: "var(--fc-border)" }}>
          <div className="flex justify-between text-dim">
            <span>Items Subtotal</span>
            <span>{formatINR(order.subtotal)}</span>
          </div>
          {Number(order.discount) > 0 && (
            <div className="flex justify-between text-emerald-600 font-semibold">
              <span>Discount ({order.couponCode || "COUPON"})</span>
              <span>- {formatINR(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-dim">
            <span>Delivery Fee</span>
            <span>{Number(order.deliveryCharge) === 0 ? "FREE" : formatINR(order.deliveryCharge)}</span>
          </div>
          <div className="flex justify-between text-dim">
            <span>Taxes (GST)</span>
            <span>{formatINR(order.tax)}</span>
          </div>
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
                gatewayName: order.payment.gatewayName,
                paymentChannel: order.payment.paymentChannel,
                instrumentDetails: order.payment.instrumentDetails,
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
