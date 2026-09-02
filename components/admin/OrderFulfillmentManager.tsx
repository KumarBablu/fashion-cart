"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/providers/ToastProvider";

interface ShipmentActivity {
  id: string;
  status: string;
  location?: string | null;
  description: string;
  timestamp: string;
}

interface SerializedShipment {
  id: string;
  carrierName: string;
  awbNumber: string;
  status: string;
  statusDescription?: string | null;
  routingCode?: string | null;
  packageWeightKg: number;
  shippingCost?: number | null;
  pickupToken?: string | null;
  pickupScheduledDate?: string | null;
  estimatedDelivery?: string | null;
  activities: ShipmentActivity[];
}

interface OrderFulfillmentManagerProps {
  orderId: string;
  orderNumber: string;
  orderStatus: string;
  store?: "garments" | "jewellery";
  initialCarrier?: string | null;
  initialTracking?: string | null;
  shipment?: SerializedShipment | null;
}

export default function OrderFulfillmentManager({
  orderId,
  orderNumber,
  orderStatus,
  store = "garments",
  initialCarrier,
  initialTracking,
  shipment,
}: OrderFulfillmentManagerProps) {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [fulfilling, setFulfilling] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showRatesModal, setShowRatesModal] = useState(false);
  const [showManualOverride, setShowManualOverride] = useState(false);
  const [showScansModal, setShowScansModal] = useState(false);

  // Manual fallback form states
  const [manualCarrier, setManualCarrier] = useState(initialCarrier || "");
  const [manualTracking, setManualTracking] = useState(initialTracking || "");
  const [manualSaving, setManualSaving] = useState(false);

  // Rates query states
  const [loadingRates, setLoadingRates] = useState(false);
  const [rates, setRates] = useState<any[]>([]);
  const [rateMeta, setRateMeta] = useState<{ pickupPincode?: string; deliveryPincode?: string; weightKg?: number }>({});

  const hasActiveShipment = Boolean(shipment && shipment.status !== "CANCELLED");
  const isCancelledOrder = orderStatus === "CANCELLED" || orderStatus === "REFUND_PENDING" || orderStatus === "REFUNDED";

  // 1-Click Fast Auto Dispatch
  async function handleAutoFulfill(preferredCourierId?: string | number) {
    setFulfilling(true);
    try {
      const res = await fetch("/api/admin/logistics/fulfill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          store,
          preferredCourierId,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        success("Fulfillment Booked", data.message || "AWB generated & pickup scheduled.");
        setShowRatesModal(false);
        // Auto-open 4x6 label in new tab
        window.open(`/api/admin/logistics/label/${orderId}?store=${store}`, "_blank");
        router.refresh();
      } else {
        toastError("Fulfillment Failed", data.error || "Could not book shipment with courier.");
      }
    } catch {
      toastError("Network Error", "Failed to communicate with fulfillment engine.");
    } finally {
      setFulfilling(false);
    }
  }

  // Fetch Live Rates
  async function handleOpenRates() {
    setShowRatesModal(true);
    setLoadingRates(true);
    try {
      const res = await fetch(`/api/admin/logistics/rates?orderId=${orderId}&store=${store}`);
      const data = await res.json();
      if (res.ok && data.rates) {
        setRates(data.rates);
        setRateMeta({
          pickupPincode: data.pickupPincode,
          deliveryPincode: data.deliveryPincode,
          weightKg: data.weightKg,
        });
      } else {
        toastError("Rate Error", data.error || "Failed to fetch live rates");
      }
    } catch {
      toastError("Error", "Could not fetch courier rates.");
    } finally {
      setLoadingRates(false);
    }
  }

  // Cancel Courier Shipment
  async function handleCancelShipment() {
    if (!confirm("Are you sure you want to cancel this courier shipment and release the AWB?")) return;
    setCancelling(true);
    try {
      const res = await fetch("/api/admin/logistics/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, store }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        success("Shipment Cancelled", "AWB and pickup request cancelled with courier.");
        router.refresh();
      } else {
        toastError("Cancellation Failed", data.error || "Could not cancel courier shipment.");
      }
    } catch {
      toastError("Error", "Network error cancelling shipment.");
    } finally {
      setCancelling(false);
    }
  }

  // Save Manual Override
  async function handleSaveManual(e: React.FormEvent) {
    e.preventDefault();
    setManualSaving(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/shipping`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carrierName: manualCarrier.trim(),
          trackingNumber: manualTracking.trim(),
        }),
      });

      if (res.ok) {
        success("Tracking Saved", "Updated custom carrier details.");
        setShowManualOverride(false);
        router.refresh();
      } else {
        toastError("Error", "Could not update tracking.");
      }
    } catch {
      toastError("Error", "Network error.");
    } finally {
      setManualSaving(false);
    }
  }

  if (isCancelledOrder) {
    return (
      <div
        className="p-6 rounded-3xl border space-y-2 card-theme opacity-80"
        style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">🛑</span>
          <h2 className="font-display text-base font-bold text-rose-700 dark:text-rose-400">
            Fulfillment Disabled (Order {orderStatus.replace(/_/g, " ")})
          </h2>
        </div>
        <p className="text-xs text-dim leading-relaxed">
          This order has been cancelled/refunded. Doorstep courier dispatch and label generation are disabled to prevent accidental shipment of restocked inventory.
        </p>
      </div>
    );
  }

  return (
    <div
      className="p-6 rounded-3xl border space-y-5 shadow-xs"
      style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4" style={{ borderColor: "var(--fc-border)" }}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl flex items-center justify-center text-xl bg-primary/10 text-primary">
            🚚
          </div>
          <div>
            <h2 className="font-display text-base font-bold flex items-center gap-2">
              <span>Logistics &amp; Courier Fulfillment Desk</span>
              {hasActiveShipment ? (
                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-extrabold uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  {shipment?.status.replace(/_/g, " ")}
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-amber-500/10 text-amber-600">
                  Awaiting Dispatch
                </span>
              )}
            </h2>
            <p className="text-xs text-dim">
              Automated multi-carrier orchestration, 4x6 thermal barcode labels, and live webhook tracking.
            </p>
          </div>
        </div>

        {hasActiveShipment && (
          <div className="flex items-center gap-2">
            <a
              href={`/api/admin/logistics/label/${orderId}?store=${store}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-white shadow-xs transition-transform active:scale-95 cursor-pointer"
              style={{ backgroundColor: "var(--fc-primary)" }}
            >
              <span>🖨️</span> Print 4x6 Label PDF
            </a>
            <button
              onClick={() => setShowScansModal(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              style={{ borderColor: "var(--fc-border)" }}
            >
              <span>📍</span> Live Scans ({shipment?.activities?.length || 1})
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {isCancelledOrder ? (
        <div className="p-5 rounded-2xl border border-rose-200 bg-rose-50/60 dark:bg-rose-950/20 dark:border-rose-900/50 space-y-3">
          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-xs uppercase tracking-wide">
            <span>⛔</span> DISPATCH LOCKED — ORDER CANCELLED / REFUNDED
          </div>
          <p className="text-xs text-rose-600/90 dark:text-rose-300 leading-relaxed">
            This order has been cancelled or requested a refund. Courier fulfillment is permanently locked to protect inventory and prevent accidental parcel dispatch.
          </p>
          {hasActiveShipment && (
            <div className="pt-3 border-t border-rose-200 dark:border-rose-900/50 flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-rose-700">Assigned AWB: {shipment?.awbNumber}</span>
              <button
                onClick={handleCancelShipment}
                disabled={cancelling}
                className="px-4 py-1.5 rounded-full text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-xs transition-colors cursor-pointer"
              >
                {cancelling ? "Cancelling…" : "🚫 Cancel Courier Shipment & Void AWB"}
              </button>
            </div>
          )}
        </div>
      ) : hasActiveShipment ? (
        /* Active Shipment Card */
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl border" style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}>
              <span className="text-[10px] font-bold text-dim uppercase block">Assigned Courier</span>
              <span className="font-bold text-xs mt-0.5 block truncate text-primary">{shipment?.carrierName}</span>
            </div>
            <div className="p-3.5 rounded-2xl border" style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}>
              <span className="text-[10px] font-bold text-dim uppercase block">Air Waybill (AWB)</span>
              <span className="font-mono font-bold text-xs mt-0.5 block truncate">{shipment?.awbNumber}</span>
            </div>
            <div className="p-3.5 rounded-2xl border" style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}>
              <span className="text-[10px] font-bold text-dim uppercase block">Weight / Routing</span>
              <span className="font-bold text-xs mt-0.5 block">
                {shipment?.packageWeightKg} kg · {shipment?.routingCode || "HUB-01"}
              </span>
            </div>
            <div className="p-3.5 rounded-2xl border" style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}>
              <span className="text-[10px] font-bold text-dim uppercase block">Pickup Token</span>
              <span className="font-mono font-semibold text-xs mt-0.5 block text-dim">
                {shipment?.pickupToken || "Scheduled"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-2">
            <div className="flex items-center gap-2 text-dim">
              <span>Status:</span>
              <strong className="text-emerald-600 font-semibold">{shipment?.statusDescription || "Booked with partner"}</strong>
            </div>
            <button
              onClick={handleCancelShipment}
              disabled={cancelling}
              className="text-xs font-bold text-rose-500 hover:text-rose-600 underline disabled:opacity-50 cursor-pointer"
            >
              {cancelling ? "Cancelling…" : "Cancel Shipment & Release AWB"}
            </button>
          </div>
        </div>
      ) : (
        /* Pending Fulfillment Action Area */
        <div className="space-y-4">
          <div className="p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-primary/5 border-primary/20">
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: "var(--fc-text)" }}>
                <span>⚡</span> Ready for 1-Click Doorstep Dispatch
              </h3>
              <p className="text-xs text-dim mt-0.5">
                Automatically queries cheapest &amp; fastest courier (Delhivery/BlueDart/DTDC), generates AWB, books pickup, and prepares thermal label.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={() => handleAutoFulfill()}
                disabled={fulfilling || isCancelledOrder}
                className="px-5 py-2.5 rounded-full text-xs font-bold text-white shadow-xs hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                style={{ backgroundColor: "var(--fc-primary)" }}
              >
                {fulfilling ? "Allocating Courier…" : "⚡ 1-Click Auto Dispatch"}
              </button>
              <button
                onClick={handleOpenRates}
                disabled={fulfilling || isCancelledOrder}
                className="px-4 py-2 rounded-full text-xs font-bold border hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                style={{ borderColor: "var(--fc-border)" }}
              >
                🔍 Compare Rates
              </button>
            </div>
          </div>

          {/* Manual Fallback Expander */}
          <div>
            <button
              onClick={() => setShowManualOverride(!showManualOverride)}
              className="text-xs text-dim hover:text-text font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>{showManualOverride ? "▼" : "▶"}</span> Custom / Manual Courier Entry (Optional)
            </button>

            {showManualOverride && (
              <form onSubmit={handleSaveManual} className="mt-3 p-4 rounded-2xl border space-y-3" style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-dim uppercase mb-1">Carrier / Partner Name</label>
                    <input
                      type="text"
                      value={manualCarrier}
                      onChange={(e) => setManualCarrier(e.target.value)}
                      placeholder="e.g. BlueDart / Delhivery / Local Boy"
                      className="w-full px-3 py-1.5 rounded-xl border text-xs outline-none focus:border-primary"
                      style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-dim uppercase mb-1">AWB / Tracking Number</label>
                    <input
                      type="text"
                      value={manualTracking}
                      onChange={(e) => setManualTracking(e.target.value)}
                      placeholder="e.g. BD918237192"
                      className="w-full px-3 py-1.5 rounded-xl border text-xs font-mono font-bold outline-none focus:border-primary"
                      style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={manualSaving}
                  className="px-4 py-1.5 rounded-full text-xs font-bold border hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50 cursor-pointer"
                  style={{ borderColor: "var(--fc-border)" }}
                >
                  {manualSaving ? "Saving…" : "Save Custom Tracking"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Compare Rates Modal */}
      {showRatesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border p-6 space-y-5 shadow-2xl" style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}>
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--fc-border)" }}>
              <div>
                <h3 className="font-display text-base font-bold">Compare Courier Rates &amp; SLAs</h3>
                <p className="text-xs text-dim">
                  Delivery to PIN {rateMeta.deliveryPincode || "Destination"} · Weight: {rateMeta.weightKg || 0.5} kg
                </p>
              </div>
              <button onClick={() => setShowRatesModal(false)} className="text-dim hover:text-text font-bold text-lg p-1 cursor-pointer">
                ✕
              </button>
            </div>

            {loadingRates ? (
              <div className="py-12 text-center text-xs text-dim space-y-2">
                <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <p>Querying real-time courier serviceability matrix…</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {rates.map((option) => (
                  <div
                    key={option.courierCode}
                    className="p-3.5 rounded-2xl border flex items-center justify-between gap-3 hover:border-primary transition-all"
                    style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs" style={{ color: "var(--fc-text)" }}>{option.courierName}</span>
                        {option.isRecommended && (
                          <span className="text-[9px] px-2 py-0.2 rounded-full font-bold uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            Best Value
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-dim block mt-0.5">
                        Est. Delivery: {option.estimatedDeliveryDays} days · Rating: ★ {option.rating || 4.8}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-display font-bold text-sm text-primary">₹{option.rate}</span>
                      <button
                        onClick={() => handleAutoFulfill(option.courierCompanyId || option.courierCode)}
                        disabled={fulfilling}
                        className="px-3.5 py-1.5 rounded-full text-xs font-bold text-white shadow-xs cursor-pointer"
                        style={{ backgroundColor: "var(--fc-primary)" }}
                      >
                        Select
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Live Scans Timeline Modal */}
      {showScansModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border p-6 space-y-4 shadow-2xl" style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}>
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--fc-border)" }}>
              <div>
                <h3 className="font-display text-base font-bold">Live Checkpoint Scans</h3>
                <p className="text-xs text-dim">AWB: {shipment?.awbNumber}</p>
              </div>
              <button onClick={() => setShowScansModal(false)} className="text-dim hover:text-text font-bold text-lg p-1 cursor-pointer">
                ✕
              </button>
            </div>

            <div className="space-y-4 max-h-80 overflow-y-auto pl-2 py-2">
              {(shipment?.activities || []).map((act, idx) => (
                <div key={act.id || idx} className="relative pl-6 border-l-2 border-primary/30 space-y-0.5">
                  <div className="absolute -left-1.5 top-0.5 h-3 w-3 rounded-full bg-primary" />
                  <p className="text-xs font-bold" style={{ color: "var(--fc-text)" }}>{act.description}</p>
                  <p className="text-[11px] text-dim">
                    {act.location ? `${act.location} · ` : ""}
                    {new Date(act.timestamp).toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
