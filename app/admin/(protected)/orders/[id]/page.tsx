import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatINR } from "@/lib/format";
import OrderStatusSelect from "@/components/admin/OrderStatusSelect";
import PaymentVerifyPanel from "@/components/admin/PaymentVerifyPanel";
import OrderFulfillmentManager from "@/components/admin/OrderFulfillmentManager";
import OrderEmailReachoutModal from "@/components/admin/OrderEmailReachoutModal";

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
              href={`https://wa.me/91${addr.mobileNumber.replace(/[^0-9]/g, "").slice(-10)}?text=${encodeURIComponent(
                `Namaste ${order.user.name}! 🛍️ Update regarding your Fashion Cart Order #${order.orderNumber} (Status: ${order.status.replace(/_/g, " ")}). View tracking & invoice: https://fashion-cart-5p7k.vercel.app/account/orders/${order.id}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider bg-emerald-600 text-white shadow-sm flex items-center gap-1.5 hover:bg-emerald-700 active:scale-95"
            >
              <span>📲</span> WhatsApp Update
            </a>
          )}
          <a
            href={`/invoices/${order.id}`}
            target="_blank"
            className="px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider text-white shadow-sm flex items-center gap-1.5 hover:brightness-105 active:scale-95"
            style={{ backgroundColor: "var(--fc-primary)" }}
          >
            <span>📄</span> Tax Invoice / Receipt
          </a>
          <a
            href={`/invoices/${order.id}`}
            target="_blank"
            className="px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider bg-[#FFBA00] text-[#0C3B2E] shadow-sm flex items-center gap-1.5 hover:bg-[#EAA800] active:scale-95"
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
        <h2 className="font-display text-base font-bold mb-3">Purchased Items &amp; Supplier Fulfillment ({order.items.length})</h2>
        <div className="divide-y text-xs" style={{ borderColor: "var(--fc-border)" }}>
          {order.items.map((item) => {
            const seller = item.product?.seller;
            const sellerName = seller?.name || item.product?.sellerName;
            const sellerId = seller?.sellerId || item.product?.sellerIdentifier;
            const sellerPhone = seller?.phone || item.product?.sellerPhone;
            const sellerEmail = seller?.email || item.product?.sellerEmail;
            const sellerUrl = seller?.url || item.product?.sellerUrl || item.product?.productUrl;

            return (
              <div key={item.id} className="py-3.5 space-y-2.5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-sm">{item.productNameSnapshot}</p>
                    <p className="text-dim mt-0.5 font-mono text-[11px]">
                      SKU: {item.skuSnapshot} · {item.colourSnapshot} / {item.sizeSnapshot} · Qty: {item.quantity} × {formatINR(item.unitPrice)}
                    </p>
                    {item.product?.categoryPath && (
                      <p className="text-[10px] text-slate-400 mt-0.5">📁 {item.product.categoryPath}</p>
                    )}
                  </div>
                  <span className="font-bold text-sm text-primary">{formatINR(item.total)}</span>
                </div>

                {/* Confidential Seller Fulfillment Box (Admin Only) */}
                {(sellerName || sellerId || sellerPhone || sellerUrl) && (
                  <div className="p-3 rounded-xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/20 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">🏭</span>
                        <span className="font-bold text-amber-900 dark:text-amber-300">
                          Supplier / Seller: <strong>{sellerName || "Direct Vendor"}</strong> {sellerId && `(${sellerId})`}
                        </span>
                      </div>
                      {sellerUrl && (
                        <a
                          href={sellerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1"
                        >
                          <span>🔗 Source Link</span> ↗
                        </a>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {sellerPhone && (
                        <>
                          <a
                            href={`https://wa.me/91${sellerPhone.replace(/[^0-9]/g, "").slice(-10)}?text=${encodeURIComponent(
                              `Hello ${sellerName || "Supplier"}, we have an order for ${item.productNameSnapshot} (SKU: ${item.skuSnapshot}, Size: ${item.sizeSnapshot}, Colour: ${item.colourSnapshot}, Qty: ${item.quantity}). Please confirm availability.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded-lg font-bold text-[11px] bg-emerald-600 text-white flex items-center gap-1 hover:bg-emerald-700 shadow-2xs"
                          >
                            <span>💬 WhatsApp Seller ({sellerPhone})</span>
                          </a>
                          <a
                            href={`tel:${sellerPhone}`}
                            className="px-2.5 py-1 rounded-lg font-bold text-[11px] bg-slate-800 text-white flex items-center gap-1 hover:bg-slate-900 shadow-2xs"
                          >
                            <span>📞 Call Seller</span>
                          </a>
                        </>
                      )}
                      {sellerEmail && (
                        <a
                          href={`mailto:${sellerEmail}?subject=${encodeURIComponent(
                            `Order Fulfillment: ${item.productNameSnapshot} (${item.skuSnapshot})`
                          )}`}
                          className="px-2.5 py-1 rounded-lg font-bold text-[11px] bg-blue-600 text-white flex items-center gap-1 hover:bg-blue-700 shadow-2xs"
                        >
                          <span>✉️ Email Seller</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
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
