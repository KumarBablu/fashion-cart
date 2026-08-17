import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
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

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { payment: true, items: true },
  });

  if (orders.length === 0) {
    return (
      <div className="rounded-3xl border p-12 text-center space-y-4" style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}>
        <div className="text-5xl">📦</div>
        <h2 className="font-display text-xl font-bold">No Orders Yet</h2>
        <p className="text-xs text-dim max-w-sm mx-auto">
          You haven&apos;t placed any orders yet. Discover our latest collections and start shopping today.
        </p>
        <Link
          href="/shop"
          className="inline-block px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider text-white shadow-md"
          style={{ backgroundColor: "var(--fc-primary)" }}
        >
          Start Shopping →
        </Link>
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
                      download
                      title="Download Tax Invoice"
                      className="p-2 rounded-lg border text-xs text-dim hover:text-primary transition-colors"
                      style={{ borderColor: "var(--fc-border)" }}
                    >
                      📥 PDF
                    </a>
                  )}

                  <Link
                    href={`/account/orders/${order.id}`}
                    className="px-4 py-2 rounded-xl text-xs font-bold border hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    style={{ borderColor: "var(--fc-border)" }}
                  >
                    View Details →
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
