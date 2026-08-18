"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/providers/ToastProvider";

export default function DeliverySettingsForm({
  initial,
}: {
  initial: { defaultCharge: number; freeDeliveryAbove: number | null };
}) {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [defaultCharge, setDefaultCharge] = useState(String(initial.defaultCharge));
  const [freeAbove, setFreeAbove] = useState(initial.freeDeliveryAbove ? String(initial.freeDeliveryAbove) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/settings/delivery", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          defaultCharge: Number(defaultCharge),
          freeDeliveryAbove: freeAbove ? Number(freeAbove) : null,
        }),
      });
      const data = await res.json().catch(() => ({ error: "Server response error" }));
      setSaving(false);

      if (!res.ok) {
        const msg = data.error || "Failed to update delivery settings";
        setError(msg);
        toastError("Save Failed", msg);
        return;
      }
      success("Delivery Settings Saved", "Updated flat shipping rates and free delivery threshold.");
      router.refresh();
    } catch (e) {
      const msg = (e as Error)?.message || "Network request failed.";
      setError(msg);
      toastError("Error", msg);
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-4 rounded-2xl border p-6 card-theme bg-white shadow-xs" style={{ borderColor: "var(--fc-border)" }}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wide text-dim">Standard Delivery Charge (₹)</span>
          <input
            type="number"
            min={0}
            value={defaultCharge}
            onChange={(e) => setDefaultCharge(e.target.value)}
            placeholder="0"
            className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-xs font-bold outline-none focus:border-[#C59B27] bg-[#FAF8F5]"
            style={{ borderColor: "var(--fc-border)" }}
          />
          <span className="text-[10px] text-dim block mt-1">Applied to standard orders under free shipping tier</span>
        </label>

        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wide text-dim">Free Delivery Above (₹)</span>
          <input
            type="number"
            min={0}
            value={freeAbove}
            onChange={(e) => setFreeAbove(e.target.value)}
            placeholder="999"
            className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-xs font-bold outline-none focus:border-[#C59B27] bg-[#FAF8F5]"
            style={{ borderColor: "var(--fc-border)" }}
          />
          <span className="text-[10px] text-dim block mt-1">Orders above this amount receive 100% Free Shipping</span>
        </label>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
          {error}
        </div>
      )}

      <div className="pt-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-[#141416] text-white px-6 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-[#25262B] transition-all cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-2"
        >
          {saving && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          <span>{saving ? "Saving Changes…" : "Save Delivery Settings"}</span>
        </button>
      </div>
    </form>
  );
}
