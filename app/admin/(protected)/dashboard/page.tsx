import { cookies } from "next/headers";
import Link from "next/link";
import { getDb } from "@/lib/db";
import { formatINR } from "@/lib/format";

export const dynamic = "force-dynamic";

const LOW_STOCK_THRESHOLD = 5;

type SearchParams = { store?: string };

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const cookieStore = await cookies();
  const cookieStoreVal = cookieStore.get("fc_admin_store")?.value;

  const store = sp.store === "jewellery" || (!sp.store && cookieStoreVal === "jewellery") ? "jewellery" : "garments";
  const db = getDb(store);

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    allOrders,
    todaysOrders,
    ordersCount,
    customersCount,
    pendingPayments,
    lowStockCount,
    recentOrders,
    pendingPaymentsList,
    topItems,
  ] = await Promise.all([
    db.order.findMany({
      where: { status: { notIn: ["CANCELLED", "REFUNDED", "REFUND_PENDING"] } },
      select: { total: true, createdAt: true },
    }),
    db.order.findMany({
      where: { createdAt: { gte: startOfToday }, status: { notIn: ["CANCELLED", "REFUNDED", "REFUND_PENDING"] } },
      select: { total: true },
    }),
    db.order.count(),
    db.user.count({ where: { role: "CUSTOMER" } }),
    db.payment.count({ where: { status: "UNDER_REVIEW" } }),
    db.productVariant.count({ where: { isActive: true, stockQuantity: { lte: LOW_STOCK_THRESHOLD } } }),
    db.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { user: true, payment: true },
    }),
    db.payment.findMany({
      where: { status: "UNDER_REVIEW" },
      orderBy: { submittedAt: "asc" },
      take: 6,
      include: { order: { include: { user: true } } },
    }),
    db.orderItem.groupBy({
      by: ["productNameSnapshot"],
      _sum: { quantity: true, total: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
  ]);

  const totalRevenue = allOrders.reduce((sum, o) => sum + Number(o.total), 0);
  const todaysSales = todaysOrders.reduce((sum, o) => sum + Number(o.total), 0);
  const avgOrderValue = ordersCount > 0 ? Math.round(totalRevenue / ordersCount) : 0;

  // Compute 7-day revenue trend
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const trendData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000);
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    const dayRev = allOrders
      .filter((o) => new Date(o.createdAt) >= dayStart && new Date(o.createdAt) < dayEnd)
      .reduce((sum, o) => sum + Number(o.total), 0);

    return { label: days[d.getDay()], date: d.getDate(), value: dayRev };
  });

  const maxTrend = Math.max(...trendData.map((t) => t.value), 1000);

  return (
    <div className="h-full overflow-y-auto min-h-0 space-y-8 pr-1 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold">Executive Analytics</h1>
          <p className="text-xs text-dim mt-0.5">Real-time overview of revenue, operations, and orders.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/api/admin/export?type=orders"
            download
            className="px-4 py-2 rounded-full border text-xs font-bold uppercase tracking-wider hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            style={{ borderColor: "var(--fc-border)" }}
          >
            📥 Export Orders CSV
          </Link>
          <Link
            href="/admin/products/new"
            className="px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider text-white shadow-sm"
            style={{ backgroundColor: "var(--fc-primary)" }}
          >
            + Add Product
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Revenue (Lifetime)" value={formatINR(totalRevenue)} icon="💰" />
        <StatCard label="Today's Sales" value={formatINR(todaysSales)} icon="⚡" />
        <StatCard label="Total Orders" value={String(ordersCount)} icon="📦" href="/admin/orders" />
        <StatCard label="Average Order Value" value={formatINR(avgOrderValue)} icon="🎯" />
      </div>

      {/* Action Alerts Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          className={`p-5 rounded-2xl border flex items-center justify-between card-theme ${
            pendingPayments > 0 ? "border-amber-500/50 bg-amber-500/5" : ""
          }`}
          style={{
            backgroundColor: pendingPayments > 0 ? undefined : "var(--fc-surface)",
            borderColor: pendingPayments > 0 ? undefined : "var(--fc-border)",
          }}
        >
          <div>
            <p className="text-xs font-bold uppercase text-dim">Pending Payment Reviews</p>
            <p className="text-2xl font-bold text-primary mt-1">{pendingPayments}</p>
            <p className="text-[11px] text-dim mt-0.5">UPI screenshot verifications waiting</p>
          </div>
          <Link
            href="/admin/payments"
            className="px-4 py-2 rounded-xl text-xs font-bold uppercase text-white shadow-xs"
            style={{ backgroundColor: "var(--fc-primary)" }}
          >
            Verify Now →
          </Link>
        </div>

        <div
          className={`p-5 rounded-2xl border flex items-center justify-between card-theme ${
            lowStockCount > 0 ? "border-rose-500/50 bg-rose-500/5" : ""
          }`}
          style={{
            backgroundColor: lowStockCount > 0 ? undefined : "var(--fc-surface)",
            borderColor: lowStockCount > 0 ? undefined : "var(--fc-border)",
          }}
        >
          <div>
            <p className="text-xs font-bold uppercase text-dim">Critical Stock Alerts</p>
            <p className="text-2xl font-bold text-rose-500 mt-1">{lowStockCount}</p>
            <p className="text-[11px] text-dim mt-0.5">Variants with ≤ 5 units remaining</p>
          </div>
          <Link
            href="/admin/inventory?status=LOW_STOCK"
            className="px-4 py-2 rounded-xl text-xs font-bold uppercase border hover:bg-black/5 dark:hover:bg-white/5"
            style={{ borderColor: "var(--fc-border)" }}
          >
            Manage Stock →
          </Link>
        </div>
      </div>

      {/* 7-Day Revenue Trend Visualizer */}
      <div
        className="p-6 rounded-3xl border space-y-4"
        style={{
          backgroundColor: "var(--fc-surface)",
          borderColor: "var(--fc-border)",
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-bold">7-Day Sales Trend</h2>
            <p className="text-xs text-dim">Daily gross volume across all confirmed orders.</p>
          </div>
          <span className="text-xs font-bold text-primary">Last 7 Days</span>
        </div>

        <div className="h-44 flex items-end justify-between gap-2 pt-6 pb-2 border-b" style={{ borderColor: "var(--fc-border)" }}>
          {trendData.map((d, i) => {
            const heightPct = Math.max(8, Math.round((d.value / maxTrend) * 100));
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <span className="text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                  {formatINR(d.value)}
                </span>
                <div
                  className="w-full max-w-[48px] rounded-t-xl transition-all group-hover:brightness-110"
                  style={{
                    height: `${heightPct}%`,
                    backgroundColor: "var(--fc-primary)",
                  }}
                />
                <span className="text-[11px] font-semibold text-dim">{d.label} {d.date}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tables Row: Recent Orders & Top Sellers */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <section
          className="p-6 rounded-3xl border space-y-4"
          style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-bold">Recent Orders</h2>
            <Link href="/admin/orders" className="text-xs font-bold text-primary hover:underline">
              View All Orders →
            </Link>
          </div>

          <div className="divide-y text-xs" style={{ borderColor: "var(--fc-border)" }}>
            {recentOrders.length === 0 ? (
              <p className="py-8 text-center text-dim">No orders placed yet.</p>
            ) : (
              recentOrders.map((o) => (
                <Link
                  key={o.id}
                  href={`/admin/orders/${o.id}`}
                  className="flex items-center justify-between py-3 hover:text-primary transition-colors"
                >
                  <div>
                    <p className="font-bold text-sm">{o.orderNumber}</p>
                    <p className="text-dim mt-0.5">
                      {o.user.name} · {new Date(o.createdAt).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">{formatINR(o.total)}</p>
                    <span className="text-[10px] text-dim uppercase">{o.status.replace(/_/g, " ")}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        {/* Top Selling Products */}
        <section
          className="p-6 rounded-3xl border space-y-4"
          style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-bold">Top Performing Products</h2>
            <Link href="/admin/products" className="text-xs font-bold text-primary hover:underline">
              Catalog →
            </Link>
          </div>

          <div className="divide-y text-xs" style={{ borderColor: "var(--fc-border)" }}>
            {topItems.length === 0 ? (
              <p className="py-8 text-center text-dim">No sales recorded yet.</p>
            ) : (
              topItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] bg-black/5 dark:bg-white/10">
                      {idx + 1}
                    </span>
                    <p className="font-bold max-w-[200px] truncate">{item.productNameSnapshot}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{item._sum.quantity} units sold</p>
                    <p className="text-dim">{formatINR(Number(item._sum.total || 0))}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  href,
}: {
  label: string;
  value: string;
  icon: string;
  href?: string;
}) {
  const content = (
    <div
      className="p-5 rounded-2xl border card-theme flex items-center justify-between"
      style={{
        backgroundColor: "var(--fc-surface)",
        borderColor: "var(--fc-border)",
      }}
    >
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-dim">{label}</p>
        <p className="text-xl sm:text-2xl font-black mt-1" style={{ color: "var(--fc-text)" }}>
          {value}
        </p>
      </div>
      <span className="text-2xl opacity-80">{icon}</span>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
