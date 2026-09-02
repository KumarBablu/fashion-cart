"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatINR } from "@/lib/format";
import { useToast } from "@/components/providers/ToastProvider";

interface OrderRow {
  id: string;
  orderNumber: string;
  createdAt: string;
  total: number;
  status: string;
  paymentMethod: string;
  cancelReason?: string | null;
  user?: { name?: string | null; email?: string | null } | null;
  payment?: {
    status?: string | null;
    refundStatus?: string | null;
    refundId?: string | null;
    instrumentDetails?: string | null;
  } | null;
  shipment?: {
    id: string;
    carrierName: string;
    awbNumber: string;
    status: string;
  } | null;
  carrierName?: string | null;
  trackingNumber?: string | null;
}

interface OrdersTableProps {
  orders: OrderRow[];
  store: "garments" | "jewellery";
}

export default function OrdersTableWithBatchDispatch({ orders, store }: OrdersTableProps) {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchLoading, setBatchLoading] = useState(false);
  const [quickFulfillingId, setQuickFulfillingId] = useState<string | null>(null);

  const fulfillableOrders = orders.filter((o) => {
    const isCancelled =
      o.status === "CANCELLED" ||
      o.status === "REFUND_PENDING" ||
      o.status === "REFUNDED" ||
      o.payment?.refundStatus === "PROCESSED" ||
      o.payment?.refundStatus === "INITIATED";
    return (o.status === "CONFIRMED" || o.status === "PROCESSING") && !o.shipment && !o.trackingNumber && !isCancelled;
  });

  function handleToggleSelect(id: string) {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  }

  function handleSelectAllFulfillable() {
    if (selectedIds.length === fulfillableOrders.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(fulfillableOrders.map((o) => o.id));
    }
  }

  // 1-Click Batch Dispatch
  async function handleBatchDispatch() {
    if (selectedIds.length === 0) return;
    setBatchLoading(true);
    try {
      const res = await fetch("/api/admin/logistics/fulfill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderIds: selectedIds,
          store,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const successes = data.results.filter((r: any) => r.success).length;
        success("Batch Fulfillment Complete", `Successfully dispatched ${successes} order(s) with courier partners.`);
        setSelectedIds([]);
        router.refresh();
      } else {
        toastError("Batch Failed", data.error || "Could not complete batch fulfillment");
      }
    } catch {
      toastError("Error", "Network error during batch fulfillment.");
    } finally {
      setBatchLoading(false);
    }
  }

  const [dispatchedMap, setDispatchedMap] = useState<Record<string, { awb: string; carrier: string }>>({});

  // Quick 1-Click Single Dispatch from Row
  async function handleQuickFulfill(orderId: string) {
    setQuickFulfillingId(orderId);
    try {
      const res = await fetch("/api/admin/logistics/fulfill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, store }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        success("Order Dispatched", data.message || "AWB allocated & pickup scheduled.");
        if (data.shipment) {
          setDispatchedMap((prev) => ({
            ...prev,
            [orderId]: {
              awb: data.shipment.awbNumber,
              carrier: data.shipment.carrierName,
            },
          }));
        }
        // Auto-open 4x6 shipping label in new tab
        window.open(`/api/admin/logistics/label/${orderId}?store=${store}`, "_blank");
        router.refresh();
      } else {
        toastError("Dispatch Error", data.error || "Failed to dispatch order.");
      }
    } catch {
      toastError("Error", "Network error.");
    } finally {
      setQuickFulfillingId(null);
    }
  }

  return (
    <div className="space-y-3">
      {/* Batch Action Bar */}
      {fulfillableOrders.length > 0 && (
        <div
          className="p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-3 shadow-xs"
          style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}
        >
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSelectAllFulfillable}
              className="text-xs font-bold text-primary hover:underline cursor-pointer"
            >
              {selectedIds.length === fulfillableOrders.length ? "Deselect All" : `Select All Ready to Ship (${fulfillableOrders.length})`}
            </button>
            <span className="text-xs text-dim">
              • {selectedIds.length} order(s) selected
            </span>
          </div>

          <button
            type="button"
            onClick={handleBatchDispatch}
            disabled={selectedIds.length === 0 || batchLoading}
            className="px-4 py-1.5 rounded-full text-xs font-bold text-white shadow-xs hover:opacity-90 disabled:opacity-40 transition-all cursor-pointer"
            style={{ backgroundColor: "var(--fc-primary)" }}
          >
            {batchLoading ? "Generating AWBs…" : `⚡ 1-Click Batch Dispatch (${selectedIds.length})`}
          </button>
        </div>
      )}

      {/* Orders Table */}
      <div className="overflow-x-auto rounded-2xl border border-line bg-white dark:bg-neutral-900 shadow-xs">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-soft bg-slate-50/50 dark:bg-neutral-800/40">
              <th className="px-3 py-3.5 w-8">
                <input
                  type="checkbox"
                  checked={selectedIds.length > 0 && selectedIds.length === fulfillableOrders.length}
                  onChange={handleSelectAllFulfillable}
                  className="h-3.5 w-3.5 rounded accent-primary cursor-pointer"
                />
              </th>
              <th className="px-4 py-3.5">Order #</th>
              <th className="px-4 py-3.5">Customer</th>
              <th className="px-4 py-3.5">Date</th>
              <th className="px-4 py-3.5">Amount</th>
              <th className="px-4 py-3.5">Payment</th>
              <th className="px-4 py-3.5">Fulfillment &amp; Courier</th>
              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => {
              const localDispatched = dispatchedMap[o.id];
              const isRefundCompleted = o.payment?.refundStatus === "PROCESSED" || o.status === "REFUNDED";
              const isRefundPending = o.payment?.refundStatus === "INITIATED" || o.status === "REFUND_PENDING";
              const isCancelled = o.status === "CANCELLED" || isRefundCompleted || isRefundPending;
              const hasShipment = Boolean(o.shipment || o.trackingNumber || localDispatched);
              const isReadyToShip = (o.status === "CONFIRMED" || o.status === "PROCESSING") && !hasShipment;

              const displayAwb = localDispatched?.awb || o.shipment?.awbNumber || o.trackingNumber;
              const displayCarrier = localDispatched?.carrier || o.shipment?.carrierName || o.carrierName || "Courier Partner";
              const displayStatus = localDispatched ? "AWB ASSIGNED" : (o.shipment?.status.replace(/_/g, " ") || o.status);

              return (
                <tr key={o.id} className="border-b border-line last:border-0 hover:bg-slate-50/60 dark:hover:bg-neutral-800/50 transition-colors">
                  {/* Checkbox */}
                  <td className="px-3 py-3.5">
                    {isReadyToShip ? (
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(o.id)}
                        onChange={() => handleToggleSelect(o.id)}
                        className="h-3.5 w-3.5 rounded accent-primary cursor-pointer"
                      />
                    ) : (
                      <span className="text-dim text-xs">—</span>
                    )}
                  </td>

                  {/* Order Number */}
                  <td className="px-4 py-3.5">
                    <Link href={`/admin/orders/${o.id}?store=${store}`} className="font-bold text-primary hover:underline font-mono text-xs">
                      {o.orderNumber}
                    </Link>
                  </td>

                  {/* Customer Info */}
                  <td className="px-4 py-3.5 text-ink-soft">
                    <div className="font-semibold text-[#141416] dark:text-white text-xs">{o.user?.name || "Guest Customer"}</div>
                    <div className="text-[10px] text-dim">{o.user?.email}</div>
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3.5 text-dim text-xs whitespace-nowrap">
                    {new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </td>

                  {/* Amount */}
                  <td className="px-4 py-3.5 font-mono font-bold text-xs">{formatINR(o.total)}</td>

                  {/* Payment Badge */}
                  <td className="px-4 py-3.5">
                    <div className="flex flex-col gap-0.5">
                      {isRefundCompleted ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 w-max">
                          ✓ REFUNDED
                        </span>
                      ) : o.payment?.status === "VERIFIED" ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 w-max">
                          ✓ Paid
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-700 dark:bg-neutral-800 dark:text-neutral-300 border border-slate-200 w-max">
                          {o.paymentMethod === "COD" ? "💵 COD" : "🕒 Pending"}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Fulfillment & Courier Status */}
                  <td className="px-4 py-3.5">
                    {isCancelled ? (
                      <div className="flex flex-col gap-0.5">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 w-max">
                          {isRefundCompleted ? "✓ REFUNDED" : "🛑 CANCELLED"}
                        </span>
                        {displayAwb && (
                          <span className="text-[10px] text-dim line-through">
                            AWB: {displayAwb} (Void)
                          </span>
                        )}
                      </div>
                    ) : hasShipment ? (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 w-max">
                            {displayStatus}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-dim">
                            {displayAwb}
                          </span>
                        </div>
                        <span className="text-[10px] text-dim">{displayCarrier}</span>
                      </div>
                    ) : isReadyToShip ? (
                      <button
                        type="button"
                        onClick={() => handleQuickFulfill(o.id)}
                        disabled={quickFulfillingId === o.id}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold text-white shadow-xs hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                        style={{ backgroundColor: "var(--fc-primary)" }}
                      >
                        {quickFulfillingId === o.id ? "Allocating…" : "⚡ 1-Click Dispatch"}
                      </button>
                    ) : (
                      <span className="text-[10px] text-dim">{o.status.replace(/_/g, " ")}</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      {hasShipment && (
                        <a
                          href={`/api/admin/logistics/label/${o.id}?store=${store}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold border border-primary text-primary hover:bg-primary/10 transition-colors"
                          title="Print 4x6 Shipping Label PDF"
                        >
                          🖨️ Print Label
                        </a>
                      )}
                      <Link
                        href={`/admin/orders/${o.id}?store=${store}`}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold border hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        style={{ borderColor: "var(--fc-border)" }}
                      >
                        Manage →
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
