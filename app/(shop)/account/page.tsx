import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { formatINR } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  PENDING_PAYMENT: { label: "Pending Payment", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)" },
  PAYMENT_REVIEW: { label: "Payment Under Review", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)" },
  CONFIRMED: { label: "Confirmed", color: "#22c55e", bg: "rgba(34, 197, 94, 0.15)" },
  PROCESSING: { label: "Processing", color: "#38bdf8", bg: "rgba(56, 189, 248, 0.15)" },
  PACKED: { label: "Packed", color: "#38bdf8", bg: "rgba(56, 189, 248, 0.15)" },
  SHIPPED: { label: "Shipped", color: "#38bdf8", bg: "rgba(56, 189, 248, 0.15)" },
  DELIVERED: { label: "Delivered", color: "#22c55e", bg: "rgba(34, 197, 94, 0.15)" },
  CANCELLED: { label: "Cancelled", color: "#f43f5e", bg: "rgba(244, 63, 94, 0.15)" },
  REFUND_PENDING: { label: "Refund Pending", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)" },
  REFUNDED: { label: "Refunded", color: "#64748b", bg: "rgba(100, 116, 139, 0.15)" },
};

export default async function OrdersPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/account");
  }

  const [garmentsOrders, jewelleryOrders] = await Promise.all([
    getDb("garments").order.findMany({
      where: {
        OR: [{ userId: user.id }, { user: { email: user.email } }],
      },
      orderBy: { createdAt: "desc" },
      include: {
        payment: true,
        items: {
          include: {
            product: { select: { slug: true, name: true, images: { take: 1, orderBy: { sortOrder: "asc" } } } },
          },
        },
      },
    }).catch(() => []),
    getDb("jewellery").order.findMany({
      where: {
        OR: [{ userId: user.id }, { user: { email: user.email } }],
      },
      orderBy: { createdAt: "desc" },
      include: {
        payment: true,
        items: {
          include: {
            product: { select: { slug: true, name: true, images: { take: 1, orderBy: { sortOrder: "asc" } } } },
          },
        },
      },
    }).catch(() => []),
  ]);

  const orders = [...garmentsOrders, ...jewelleryOrders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (orders.length === 0) {
    return (
      <div className="rounded-3xl border p-12 text-center space-y-4" style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}>
        <div className="text-5xl">📦</div>
        <h2 className="font-display text-xl font-bold">No Orders Yet</h2>
        <p className="text-xs text-dim max-w-sm mx-auto">
          You haven&apos;t placed any orders yet. Discover our latest collections and start shopping today.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/garments"
            className="inline-block px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider text-white shadow-md bg-[#141416] hover:bg-[#25262B] transition-colors"
          >
            Explore Garments →
          </Link>
          <Link
            href="/jewellery"
            className="inline-block px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider text-white shadow-md bg-[#C59B27] hover:bg-[#D4AF37] transition-colors"
          >
            Explore Jewellery →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-2xl font-bold">Order History</h2>
        <p className="text-xs text-dim mt-0.5">Track shipment progress, view details, and download tax invoices.</p>
      </div>

      <div className="space-y-3">
        {orders.map((order) => {
          const statusInfo = STATUS_LABEL[order.status] || { label: order.status, color: "var(--fc-text)", bg: "transparent" };
          const isPaid = order.payment?.status === "VERIFIED" || order.status === "CONFIRMED" || order.status === "DELIVERED";
          const isJewelleryOrder = order.orderNumber.startsWith("FC-JW");

          return (
            <div
              key={order.id}
              className="rounded-2xl border p-5 transition-all card-theme flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <Link href={`/account/orders/${order.id}`} className="font-bold text-sm hover:text-primary transition-colors">
                    {order.orderNumber}
                  </Link>
                  <span
                    className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                    style={{ backgroundColor: statusInfo.bg, color: statusInfo.color }}
                  >
                    {statusInfo.label}
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
                <p className="text-xs text-dim">
                  Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })} · {order.items.length} item{order.items.length > 1 ? "s" : ""}
                </p>
              </div>

              <div className="flex items-center gap-4 justify-between sm:justify-end">
                <div className="text-left sm:text-right">
                  <p className="text-base font-bold text-primary">{formatINR(order.total)}</p>
                  <p className="text-[11px] text-dim">{order.paymentMethod.replace(/_/g, " ")}</p>
                </div>

                <div className="flex items-center gap-2">
                  {isPaid && (
                    <a
                      href={`/api/invoices/${order.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-full border text-xs font-semibold hover:border-primary hover:text-primary transition-colors"
                      style={{ borderColor: "var(--fc-border)" }}
                    >
                      Invoice
                    </a>
                  )}
                  <Link
                    href={`/account/orders/${order.id}`}
                    className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-white"
                    style={{ backgroundColor: "var(--fc-primary)" }}
                  >
                    Details →
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
