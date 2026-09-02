"use client";

import { useState } from "react";
import { useToast } from "@/components/providers/ToastProvider";

export default function LiveRateCalculator({ store = "garments" }: { store?: "garments" | "jewellery" }) {
  const { error: toastError } = useToast();
  const [deliveryPincode, setDeliveryPincode] = useState("110001");
  const [weightKg, setWeightKg] = useState(store === "jewellery" ? "0.15" : "0.6");
  const [isCod, setIsCod] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rates, setRates] = useState<any[]>([]);
  const [pickupPincode, setPickupPincode] = useState("395002");

  async function handleCalculate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setRates([]);
    try {
      const res = await fetch("/api/admin/logistics/calculator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryPincode,
          weightKg: Number(weightKg),
          isCod,
          store,
        }),
      });

      const data = await res.json();
      if (res.ok && data.rates) {
        setRates(data.rates);
        if (data.pickupPincode) setPickupPincode(data.pickupPincode);
      } else {
        toastError("Calculation Failed", data.error || "Could not calculate rates");
      }
    } catch {
      toastError("Error", "Network error calculating rates.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="p-6 rounded-3xl border space-y-5"
      style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}
    >
      <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--fc-border)" }}>
        <div>
          <h3 className="font-display text-base font-bold flex items-center gap-2">
            <span>⚡</span> Real-Time Courier Rate &amp; Serviceability Estimator
          </h3>
          <p className="text-xs text-dim">
            Simulate live delivery pricing, courier SLAs, and COD eligibility from your pickup hub to any pincode in India.
          </p>
        </div>
      </div>

      <form onSubmit={handleCalculate} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
        <div>
          <label className="block text-[11px] font-bold text-dim uppercase mb-1">Destination PIN Code</label>
          <input
            type="text"
            maxLength={6}
            value={deliveryPincode}
            onChange={(e) => setDeliveryPincode(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="e.g. 110001"
            className="w-full px-3 py-2 rounded-xl border text-xs font-mono font-bold outline-none focus:border-primary"
            style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-dim uppercase mb-1">Parcel Weight (kg)</label>
          <input
            type="number"
            step="0.05"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:border-primary"
            style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-dim uppercase mb-1">Payment Type</label>
          <select
            value={isCod ? "cod" : "prepaid"}
            onChange={(e) => setIsCod(e.target.value === "cod")}
            className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:border-primary"
            style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}
          >
            <option value="prepaid">Prepaid Order</option>
            <option value="cod">Cash on Delivery (COD)</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2.5 rounded-full text-xs font-bold text-white shadow-xs hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer"
          style={{ backgroundColor: "var(--fc-primary)" }}
        >
          {loading ? "Calculating Rates…" : "🔍 Check Rates & SLAs"}
        </button>
      </form>

      {/* Results */}
      {rates.length > 0 && (
        <div className="pt-2 space-y-2">
          <div className="flex items-center justify-between text-xs text-dim">
            <span>
              Route: <strong>PIN {pickupPincode}</strong> (Origin Hub) ➔ <strong>PIN {deliveryPincode}</strong> (Destination)
            </span>
            <span>{rates.length} courier options available</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {rates.map((r) => (
              <div
                key={r.courierCode}
                className="p-4 rounded-2xl border space-y-1.5 hover:border-primary transition-all"
                style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs" style={{ color: "var(--fc-text)" }}>{r.courierName}</span>
                  {r.isRecommended && (
                    <span className="text-[9px] px-2 py-0.2 rounded-full font-bold uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      Top Choice
                    </span>
                  )}
                </div>
                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-sm font-bold text-primary">₹{r.rate}</span>
                  <span className="text-[11px] text-dim">{r.estimatedDeliveryDays} days transit</span>
                </div>
                <div className="text-[10px] text-dim flex items-center justify-between pt-1 border-t" style={{ borderColor: "var(--fc-border)" }}>
                  <span>Rating: ★ {r.rating || 4.8}</span>
                  <span className={r.isCodAvailable ? "text-emerald-600" : "text-amber-600"}>
                    {r.isCodAvailable ? "✓ COD Ready" : "Prepaid Only"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
