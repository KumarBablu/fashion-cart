"use client";

import { useState } from "react";
import { useToast } from "@/components/providers/ToastProvider";
import { AllStoresControl } from "@/lib/stores";

export default function StoreAvailabilityManager({
  initial,
}: {
  initial: AllStoresControl;
}) {
  const { success, error: toastError } = useToast();
  const [stores, setStores] = useState<AllStoresControl>(initial);
  const [saving, setSaving] = useState(false);

  async function handleToggleStore(storeKey: "garments" | "jewellery") {
    const updated = {
      ...stores,
      [storeKey]: {
        ...stores[storeKey],
        isActive: !stores[storeKey].isActive,
      },
    };

    setStores(updated);
    await saveChanges(updated);
  }

  async function handleMessageChange(storeKey: "garments" | "jewellery", message: string) {
    setStores({
      ...stores,
      [storeKey]: {
        ...stores[storeKey],
        closedMessage: message,
      },
    });
  }

  async function saveChanges(payloadToSave?: AllStoresControl) {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadToSave || stores),
      });

      const data = await res.json();
      setSaving(false);

      if (res.ok) {
        success("Store Visibility Saved 🎉", "Store availability statuses updated across the live platform.");
      } else {
        toastError("Save Failed", data.error || "Could not update store status.");
      }
    } catch {
      setSaving(false);
      toastError("Error", "Network error while updating store status.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 👗 GARMENTS STORE CARD */}
        <div
          className={`rounded-3xl p-6 border transition-all space-y-4 shadow-sm ${
            stores.garments.isActive
              ? "bg-white dark:bg-neutral-800 border-slate-200 dark:border-neutral-700"
              : "bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl p-2 rounded-2xl bg-neutral-100 dark:bg-neutral-700">👗</span>
              <div>
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                  Garments &amp; Apparel Boutique
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400">
                  Haute couture, silk sarees, kurtis &amp; linen
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleToggleStore("garments")}
              disabled={saving}
              className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs active:scale-95 ${
                stores.garments.isActive
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-rose-600 hover:bg-rose-700 text-white"
              }`}
            >
              {stores.garments.isActive ? "🟢 LIVE / ACTIVE" : "🔴 INACTIVE / CLOSED"}
            </button>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-neutral-700">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-neutral-300">
              Customer Closed / Maintenance Notice:
            </label>
            <textarea
              rows={2}
              value={stores.garments.closedMessage}
              onChange={(e) => handleMessageChange("garments", e.target.value)}
              placeholder="Notice shown to customers when this store is inactive..."
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 focus:outline-none focus:border-[#141416]"
            />
          </div>

          <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500">
            <span>Customer Visibility:</span>
            <span className={`font-bold ${stores.garments.isActive ? "text-emerald-600" : "text-rose-600"}`}>
              {stores.garments.isActive ? "✓ Publicly Accessible" : "✕ Hidden / Shows Closed Message"}
            </span>
          </div>
        </div>

        {/* 💍 JEWELLERY STORE CARD */}
        <div
          className={`rounded-3xl p-6 border transition-all space-y-4 shadow-sm ${
            stores.jewellery.isActive
              ? "bg-[#061A14] text-white border-[#D4AF37]/50 shadow-md"
              : "bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800 text-slate-900"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl p-2 rounded-2xl bg-[#0D2C22] border border-[#D4AF37]/30 text-[#F3E5AB]">💍</span>
              <div>
                <h3 className={`font-display text-base font-bold ${stores.jewellery.isActive ? "text-[#F3E5AB]" : "text-slate-900 dark:text-white"}`}>
                  Imperial Fine &amp; Artificial Jewellery
                </h3>
                <p className={`text-xs ${stores.jewellery.isActive ? "text-[#FAF8F5]/70" : "text-slate-500 dark:text-neutral-400"}`}>
                  24K micro-plated Kundan, Polki &amp; Solitaires
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleToggleStore("jewellery")}
              disabled={saving}
              className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs active:scale-95 ${
                stores.jewellery.isActive
                  ? "bg-[#D4AF37] hover:bg-[#E5C158] text-[#061A14] font-extrabold"
                  : "bg-rose-600 hover:bg-rose-700 text-white"
              }`}
            >
              {stores.jewellery.isActive ? "🟢 LIVE / ACTIVE" : "🔴 INACTIVE / CLOSED"}
            </button>
          </div>

          <div className="space-y-2 pt-2 border-t border-[#D4AF37]/20">
            <label className={`block text-[11px] font-bold uppercase tracking-wider ${stores.jewellery.isActive ? "text-[#F3E5AB]" : "text-slate-600"}`}>
              Customer Closed / Maintenance Notice:
            </label>
            <textarea
              rows={2}
              value={stores.jewellery.closedMessage}
              onChange={(e) => handleMessageChange("jewellery", e.target.value)}
              placeholder="Notice shown to customers when this store is inactive..."
              className={`w-full text-xs px-3.5 py-2.5 rounded-xl border focus:outline-none ${
                stores.jewellery.isActive
                  ? "bg-[#0D2C22] border-[#D4AF37]/40 text-white placeholder:text-[#FAF8F5]/40 focus:border-[#F3E5AB]"
                  : "border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-900"
              }`}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] pt-1">
            <span className={stores.jewellery.isActive ? "text-[#FAF8F5]/70" : "text-slate-500"}>Customer Visibility:</span>
            <span className={`font-bold ${stores.jewellery.isActive ? "text-[#D4AF37]" : "text-rose-600"}`}>
              {stores.jewellery.isActive ? "✓ Publicly Accessible" : "✕ Hidden / Shows Closed Message"}
            </span>
          </div>
        </div>

      </div>

      <div className="flex items-center justify-end pt-2">
        <button
          type="button"
          onClick={() => saveChanges()}
          disabled={saving}
          className="px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#141416] hover:bg-[#25262B] text-white shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50"
        >
          {saving ? "Updating Live Status…" : "Save Custom Notices →"}
        </button>
      </div>
    </div>
  );
}
