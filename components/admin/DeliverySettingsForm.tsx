"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeliverySettingsForm({
  initial,
}: {
  initial: { defaultCharge: number; freeDeliveryAbove: number | null };
}) {
  const router = useRouter();
  const [defaultCharge, setDefaultCharge] = useState(String(initial.defaultCharge));
  const [freeAbove, setFreeAbove] = useState(initial.freeDeliveryAbove ? String(initial.freeDeliveryAbove) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    const res = await fetch("/api/admin/settings/delivery", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        defaultCharge: Number(defaultCharge),
        freeDeliveryAbove: freeAbove ? Number(freeAbove) : null,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={save} className="space-y-4 rounded-lg border border-line bg-white p-5">
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Default Delivery Charge (₹)</span>
        <input type="number" min={0} value={defaultCharge} onChange={(e) => setDefaultCharge(e.target.value)} className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm" />
      </label>
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Free Delivery Above (₹, optional)</span>
        <input type="number" min={0} value={freeAbove} onChange={(e) => setFreeAbove(e.target.value)} className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm" />
      </label>
      {error && <p className="text-sm text-fc-red">{error}</p>}
      {saved && <p className="text-sm text-emerald-700">Saved.</p>}
      <button disabled={saving} className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
        {saving ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
