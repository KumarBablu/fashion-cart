"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/providers/ToastProvider";

export default function OrderFulfillmentManager({
  orderId,
  initialCarrier,
  initialTracking,
}: {
  orderId: string;
  initialCarrier?: string | null;
  initialTracking?: string | null;
}) {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [carrier, setCarrier] = useState(initialCarrier || "");
  const [tracking, setTracking] = useState(initialTracking || "");
  const [saving, setSaving] = useState(false);

  async function handleSaveTracking(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/shipping`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carrierName: carrier.trim(),
          trackingNumber: tracking.trim(),
        }),
      });

      if (res.ok) {
        success("Tracking Saved", "Updated courier tracking details.");
        router.refresh();
      } else {
        toastError("Error", "Could not update tracking.");
      }
    } catch {
      toastError("Error", "Network error.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSaveTracking} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-bold text-dim uppercase mb-1">Courier / Carrier</label>
          <input
            type="text"
            value={carrier}
            onChange={(e) => setCarrier(e.target.value)}
            placeholder="e.g. BlueDart / Delhivery / DTDC"
            className="w-full px-3 py-1.5 rounded-xl border text-xs outline-none focus:border-primary"
            style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-dim uppercase mb-1">AWB / Tracking Number</label>
          <input
            type="text"
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            placeholder="e.g. BD918237192"
            className="w-full px-3 py-1.5 rounded-xl border text-xs font-mono font-bold outline-none focus:border-primary"
            style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={saving}
        className="px-4 py-1.5 rounded-full text-xs font-bold uppercase border hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
        style={{ borderColor: "var(--fc-border)" }}
      >
        {saving ? "Saving…" : "Save Tracking Info"}
      </button>
    </form>
  );
}
