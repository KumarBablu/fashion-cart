import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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

  let order = await prisma.order.findFirst({
    where: {
      id,
      OR: [
        { userId: user.id },
        { user: { email: user.email } },
      ],
    },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: { take: 1, orderBy: { sortOrder: "asc" } },
            },
          },
        },
      },
      payment: true,
      invoice: true,
    },
  });

  if (!order) {
    const { getDb } = await import("@/lib/db");
    order = await getDb("jewellery").order.findFirst({
      where: {
        id,
        OR: [
          { userId: user.id },
          { user: { email: user.email } },
        ],
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { take: 1, orderBy: { sortOrder: "asc" } },
              },
            },
          },
        },
        payment: true,
        invoice: true,
      },
    });
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

  const isPaid = order.payment?.status === "VERIFIED" || order.status === "CONFIRMED" || order.status === "DELIVERED";
  const isJewelleryOrder = order.orderNumber.startsWith("FC-JW");

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
            <span
              className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider"
              style={{
                backgroundColor: isJewelleryOrder ? "rgba(197, 155, 39, 0.15)" : "rgba(20, 20, 22, 0.08)",
                color: isJewelleryOrder ? "#C59B27" : "var(--fc-text)",
              }}
            >
              {isJewelleryOrder ? "💍 Jewellery" : "👗 Garments"}
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
          isJewellery={isJewelleryOrder}
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

      {/* Ordered Items Table with Re-direct link to product */}
      <div className="p-6 rounded-2xl border" style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}>
        <h3 className="font-display text-base font-bold mb-3">Order Items</h3>
        <div className="divide-y" style={{ borderColor: "var(--fc-border)" }}>
          {order.items.map((item) => {
            const rawSlug = item.product?.slug || item.productNameSnapshot.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
            const productHref = rawSlug ? `/products/${rawSlug}${isJewelleryOrder ? "?store=jewellery" : ""}` : null;
            const productImage = item.product?.images?.[0]?.imageUrl;

            return (
              <div key={item.id} className="flex flex-wrap justify-between items-center py-4 text-sm gap-3">
                <div className="flex items-center gap-3">
                  {productImage ? (
                    <div className="relative h-14 w-12 rounded-lg overflow-hidden border shrink-0 bg-white" style={{ borderColor: "var(--fc-border)" }}>
                      <Image
                        src={productImage}
                        alt={item.productNameSnapshot}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-14 w-12 rounded-lg border flex items-center justify-center shrink-0 text-xl" style={{ borderColor: "var(--fc-border)" }}>
                      {isJewelleryOrder ? "💍" : "👗"}
                    </div>
                  )}
                  <div>
                    {productHref ? (
                      <Link href={productHref} className="font-bold text-sm hover:underline" style={{ color: "var(--fc-text)" }}>
                        {item.productNameSnapshot}
                      </Link>
                    ) : (
                      <p className="font-bold text-sm" style={{ color: "var(--fc-text)" }}>
                        {item.productNameSnapshot}
                      </p>
                    )}
                    <p className="text-xs text-dim mt-0.5">
                      SKU: <span className="font-mono">{item.skuSnapshot}</span> · {item.colourSnapshot} / {item.sizeSnapshot} · Qty: {item.quantity}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {productHref && (
                    <Link
                      href={productHref}
                      className="px-3.5 py-1.5 rounded-full border text-xs font-bold transition-all hover:bg-black/5 dark:hover:bg-white/5"
                      style={{ borderColor: "var(--fc-border)", color: "var(--fc-text)" }}
                    >
                      View Product ↗
                    </Link>
                  )}
                  {order.status === "DELIVERED" && (
                    <Link
                      href={isJewelleryOrder ? "/jewellery" : "/garments"}
                      className="px-3 py-1 rounded-full border border-[#FFBA00] text-[11px] font-bold text-[#0C3B2E] bg-[#FFF7E0] hover:bg-[#FFBA00] transition-colors"
                    >
                      ⭐ Write Review
                    </Link>
                  )}
                  <span className="font-bold text-base text-primary">{formatINR(item.total)}</span>
                </div>
              </div>
            );
          })}
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
            {addr.addressLine2 && `, ${addr.addressLine2}`}
            <br />
            {addr.city}, {addr.state} - {addr.pinCode}
            {addr.landmark && <span className="block mt-1">Landmark: {addr.landmark}</span>}
            <span className="block mt-1">📞 {addr.mobileNumber}</span>
          </p>
        </div>

        <div className="p-6 rounded-2xl border" style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}>
          <h3 className="font-display text-base font-bold mb-3">Payment Information</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-dim">Payment Method</span>
              <span className="font-semibold">{order.paymentMethod.replace(/_/g, " ")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dim">Payment Status</span>
              <span className="font-semibold">{order.payment?.status?.replace(/_/g, " ") ?? "PENDING"}</span>
            </div>
            {order.payment?.utrNumber && (
              <div className="flex justify-between">
                <span className="text-dim">UTR / Ref Number</span>
                <span className="font-mono font-semibold">{order.payment.utrNumber}</span>
              </div>
            )}
            {order.payment?.verifiedAt && (
              <div className="flex justify-between">
                <span className="text-dim">Verified At</span>
                <span>{new Date(order.payment.verifiedAt).toLocaleDateString("en-IN")}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
