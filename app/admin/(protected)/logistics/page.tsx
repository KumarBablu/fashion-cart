import { cookies } from "next/headers";
import Link from "next/link";
import { getDb, prisma } from "@/lib/db";
import LogisticsSettingsForm from "@/components/admin/LogisticsSettingsForm";
import LiveRateCalculator from "@/components/admin/LiveRateCalculator";

export const dynamic = "force-dynamic";

export default async function AdminLogisticsPage({
  searchParams,
}: {
  searchParams: Promise<{ store?: string }>;
}) {
  const sp = await searchParams;
  const cookieStore = await cookies();
  const cookieStoreVal = cookieStore.get("fc_admin_store")?.value;

  const store = sp.store === "jewellery" || (!sp.store && cookieStoreVal === "jewellery") ? "jewellery" : "garments";
  const db = getDb(store);

  const [
    logisticsSettings,
    pickupLocation,
    shipments,
    awaitingCount,
    inTransitCount,
    deliveredCount,
    garmentsCount,
    jewelleryCount,
  ] = await Promise.all([
    prisma.logisticsSettings.findFirst(),
    prisma.pickupLocation.findFirst({ where: { isDefault: true } }),
    db.shipment.findMany({
      orderBy: { createdAt: "desc" },
      take: 25,
      include: {
        order: { include: { user: true } },
      },
    }),
    db.order.count({ where: { status: "CONFIRMED" } }),
    db.shipment.count({ where: { status: { in: ["AWB_ASSIGNED", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"] } } }),
    db.shipment.count({ where: { status: "DELIVERED" } }),
    getDb("garments").shipment.count().catch(() => 0),
    getDb("jewellery").shipment.count().catch(() => 0),
  ]);

  return (
    <div className="h-full overflow-y-auto min-h-0 space-y-8 pr-1 pb-16 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <span>🚀</span> Courier &amp; Shipping Hub
            </h1>
            <div className="flex items-center gap-1.5 p-1 rounded-full bg-black/5 dark:bg-white/5 border border-[#E7DFD5] dark:border-neutral-800">
              <Link
                href="/admin/logistics?store=garments"
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  store === "garments" ? "bg-[#141416] text-white shadow-xs" : "text-dim hover:text-text"
                }`}
              >
                👗 Garments ({garmentsCount})
              </Link>
              <Link
                href="/admin/logistics?store=jewellery"
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  store === "jewellery" ? "bg-[#C59B27] text-white shadow-xs" : "text-dim hover:text-text"
                }`}
              >
                💍 Jewellery ({jewelleryCount})
              </Link>
            </div>
          </div>
          <p className="text-xs text-dim mt-1">
            Automated multi-carrier logistics, doorstep pickup scheduling, 4x6 thermal barcode labels, and live webhook tracking.
          </p>
        </div>

        <Link
          href={`/admin/orders?store=${store}&status=CONFIRMED`}
          className="px-4 py-2 rounded-full text-xs font-bold text-white shadow-xs flex items-center gap-1.5 w-max"
          style={{ backgroundColor: "var(--fc-primary)" }}
        >
          <span>📦</span> View Ready-to-Ship Orders ({awaitingCount}) →
        </Link>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl border" style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}>
          <span className="text-[10px] font-bold text-dim uppercase block">Awaiting Dispatch</span>
          <span className="text-2xl font-bold font-display text-amber-600 mt-1 block">{awaitingCount}</span>
          <span className="text-[10px] text-dim block mt-0.5">Confirmed &amp; ready to pack</span>
        </div>

        <div className="p-4 rounded-2xl border" style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}>
          <span className="text-[10px] font-bold text-dim uppercase block">Active / In-Transit</span>
          <span className="text-2xl font-bold font-display text-primary mt-1 block">{inTransitCount}</span>
          <span className="text-[10px] text-dim block mt-0.5">With courier network</span>
        </div>

        <div className="p-4 rounded-2xl border" style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}>
          <span className="text-[10px] font-bold text-dim uppercase block">Delivered Parcels</span>
          <span className="text-2xl font-bold font-display text-emerald-600 mt-1 block">{deliveredCount}</span>
          <span className="text-[10px] text-dim block mt-0.5">Successfully reached doorstep</span>
        </div>

        <div className="p-4 rounded-2xl border" style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}>
          <span className="text-[10px] font-bold text-dim uppercase block">Engine Mode</span>
          <span className="text-sm font-bold mt-2 block uppercase text-primary">
            {logisticsSettings?.environment === "production" ? "🟢 Production Live" : "🟡 Sandbox Simulated"}
          </span>
          <span className="text-[10px] text-dim block mt-0.5">
            {logisticsSettings?.provider === "shiprocket" ? "Shiprocket (17+ Couriers)" : "Manual Delivery"}
          </span>
        </div>
      </div>

      {/* 1. Live Rate Calculator & Pincode Checker */}
      <section className="space-y-2">
        <LiveRateCalculator store={store} />
      </section>

      {/* 2. Recent Shipments Table */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-bold flex items-center gap-2">
            <span>📋</span> Active &amp; Dispatched Shipments
          </h2>
          <span className="text-xs text-dim">Showing recent {shipments.length} shipment(s)</span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-line bg-white dark:bg-neutral-900 shadow-xs">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-soft bg-slate-50/50 dark:bg-neutral-800/40">
                <th className="px-4 py-3.5">AWB Tracking #</th>
                <th className="px-4 py-3.5">Order #</th>
                <th className="px-4 py-3.5">Courier Partner</th>
                <th className="px-4 py-3.5">Customer</th>
                <th className="px-4 py-3.5">Weight / Routing</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Label &amp; Actions</th>
              </tr>
            </thead>
            <tbody>
              {shipments.map((s) => (
                <tr key={s.id} className="border-b border-line last:border-0 hover:bg-slate-50/60 dark:hover:bg-neutral-800/50 transition-colors">
                  <td className="px-4 py-3.5 font-mono font-bold text-xs text-primary">
                    {s.awbNumber}
                  </td>
                  <td className="px-4 py-3.5">
                    <Link href={`/admin/orders/${s.orderId}?store=${store}`} className="font-bold text-xs hover:underline font-mono">
                      {s.order?.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3.5 text-xs font-semibold">
                    {s.carrierName}
                  </td>
                  <td className="px-4 py-3.5 text-xs">
                    <div className="font-semibold">{s.order?.user?.name || "Customer"}</div>
                    <div className="text-[10px] text-dim">{s.order?.user?.email}</div>
                  </td>
                  <td className="px-4 py-3.5 text-xs">
                    {Number(s.packageWeightKg)} kg · {s.routingCode || "HUB-01"}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200">
                      {s.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <a
                        href={`/api/admin/logistics/label/${s.orderId}?store=${store}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded-lg text-xs font-bold border hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        style={{ borderColor: "var(--fc-border)" }}
                        title="Print 4x6 Thermal Label"
                      >
                        🖨️ 4x6 Label
                      </a>
                      <Link
                        href={`/admin/orders/${s.orderId}?store=${store}`}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold border hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        style={{ borderColor: "var(--fc-border)" }}
                      >
                        Track →
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {shipments.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-dim text-xs">
                    No shipments dispatched yet for this store. Go to Orders to dispatch your first confirmed order.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. Doorstep Pickup Hub & Shiprocket Configuration */}
      <section className="space-y-3">
        <LogisticsSettingsForm
          initialSettings={
            logisticsSettings
              ? {
                  provider: logisticsSettings.provider,
                  environment: logisticsSettings.environment,
                  apiEmail: logisticsSettings.apiEmail,
                  apiPassword: logisticsSettings.apiPassword,
                  autoFulfillEnabled: logisticsSettings.autoFulfillEnabled,
                  defaultGarmentWeight: Number(logisticsSettings.defaultGarmentWeight),
                  defaultJewelWeight: Number(logisticsSettings.defaultJewelWeight),
                }
              : null
          }
          initialPickup={pickupLocation}
        />
      </section>
    </div>
  );
}
