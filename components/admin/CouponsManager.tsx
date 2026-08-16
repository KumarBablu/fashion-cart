"use client";

import { useState } from "react";
import { formatINR } from "@/lib/format";
import { useToast } from "@/components/providers/ToastProvider";

type Coupon = {
  id: string;
  code: string;
  description: string | null;
  discountType: string;
  discountValue: number | string;
  minOrderAmount: number | string | null;
  maxDiscountAmount: number | string | null;
  usageLimit: number | null;
  usedCount: number;
  endDate: string | Date | null;
  isActive: boolean;
  createdAt: string | Date;
};

export default function CouponsManager({ initialCoupons }: { initialCoupons: Coupon[] }) {
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const { success, error: toastError } = useToast();

  // Form state
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState("");
  const [minOrderAmount, setMinOrderAmount] = useState("");
  const [maxDiscountAmount, setMaxDiscountAmount] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [endDate, setEndDate] = useState("");

  async function loadCoupons() {
    try {
      const res = await fetch("/api/admin/coupons");
      if (res.ok) {
        const data = await res.json();
        setCoupons(data.coupons || []);
      }
    } catch {
      // ignore
    }
  }

  async function handleCreateCoupon(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          description: description.trim() || undefined,
          discountType,
          discountValue: Number(discountValue),
          minOrderAmount: minOrderAmount ? Number(minOrderAmount) : undefined,
          maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : undefined,
          usageLimit: usageLimit ? Number(usageLimit) : undefined,
          endDate: endDate || undefined,
          isActive: true,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        success("Coupon Created! 🏷️", `Promo code ${data.coupon.code} is now live.`);
        setCode("");
        setDescription("");
        setDiscountValue("");
        setMinOrderAmount("");
        setMaxDiscountAmount("");
        setUsageLimit("");
        setEndDate("");
        setShowForm(false);
        loadCoupons();
      } else {
        toastError("Error", data.error || "Could not create coupon.");
      }
    } catch {
      toastError("Error", "Network request failed.");
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(id: string, current: boolean) {
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !current }),
      });
      if (res.ok) {
        setCoupons((prev) =>
          prev.map((c) => (c.id === id ? { ...c, isActive: !current } : c))
        );
        success("Status Updated", `Coupon ${!current ? "Activated" : "Deactivated"}`);
      }
    } catch {
      toastError("Error", "Could not toggle status.");
    }
  }

  async function deleteCoupon(id: string, codeName: string) {
    if (!confirm(`Are you sure you want to delete coupon ${codeName}?`)) return;
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
      if (res.ok) {
        setCoupons((prev) => prev.filter((c) => c.id !== id));
        success("Deleted", `Coupon ${codeName} deleted.`);
      }
    } catch {
      toastError("Error", "Could not delete coupon.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Coupons & Promo Codes</h1>
          <p className="text-xs text-dim mt-0.5">Manage customer promotional discounts, percentage caps, and usage limits.</p>
        </div>
        <button
          onClick={() => setShowForm((p) => !p)}
          className="px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider text-white shadow-sm"
          style={{ backgroundColor: "var(--fc-primary)" }}
        >
          {showForm ? "✕ Cancel" : "+ Create Promo Code"}
        </button>
      </div>

      {/* Creation Modal / Form */}
      {showForm && (
        <form
          onSubmit={handleCreateCoupon}
          className="p-6 rounded-2xl border space-y-4 animate-in fade-in duration-200"
          style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}
        >
          <h3 className="font-display text-lg font-bold">Create New Promotional Code</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-dim mb-1">Coupon Code *</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. SUMMER25"
                className="w-full px-3.5 py-2 rounded-xl border text-xs font-mono font-bold uppercase outline-none focus:border-primary"
                style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-dim mb-1">Discount Type *</label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as "PERCENTAGE" | "FIXED")}
                className="w-full px-3.5 py-2 rounded-xl border text-xs outline-none focus:border-primary"
                style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}
              >
                <option value="PERCENTAGE">Percentage (% Off)</option>
                <option value="FIXED">Fixed Amount (₹ Flat Off)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-dim mb-1">
                Discount Value * {discountType === "PERCENTAGE" ? "(%)" : "(₹)"}
              </label>
              <input
                type="number"
                required
                min={1}
                max={discountType === "PERCENTAGE" ? 100 : 10000}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder={discountType === "PERCENTAGE" ? "e.g. 15" : "e.g. 200"}
                className="w-full px-3.5 py-2 rounded-xl border text-xs font-bold outline-none focus:border-primary"
                style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-dim mb-1">Min Order Subtotal (₹)</label>
              <input
                type="number"
                min={0}
                value={minOrderAmount}
                onChange={(e) => setMinOrderAmount(e.target.value)}
                placeholder="e.g. 999"
                className="w-full px-3.5 py-2 rounded-xl border text-xs outline-none focus:border-primary"
                style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-dim mb-1">Max Discount Cap (₹)</label>
              <input
                type="number"
                min={0}
                value={maxDiscountAmount}
                onChange={(e) => setMaxDiscountAmount(e.target.value)}
                placeholder="e.g. 500 (For % codes)"
                className="w-full px-3.5 py-2 rounded-xl border text-xs outline-none focus:border-primary"
                style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-dim mb-1">Usage Limit (Max Uses)</label>
              <input
                type="number"
                min={1}
                value={usageLimit}
                onChange={(e) => setUsageLimit(e.target.value)}
                placeholder="e.g. 100 (Leave blank for unlimited)"
                className="w-full px-3.5 py-2 rounded-xl border text-xs outline-none focus:border-primary"
                style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase text-dim mb-1">Description / Tagline</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Flat 15% discount on festive dresses"
                className="w-full px-3.5 py-2 rounded-xl border text-xs outline-none focus:border-primary"
                style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-dim mb-1">Expiration Date (Optional)</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border text-xs outline-none focus:border-primary"
                style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl border text-xs text-dim"
              style={{ borderColor: "var(--fc-border)" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 rounded-xl font-bold text-xs uppercase text-white shadow-sm disabled:opacity-50"
              style={{ backgroundColor: "var(--fc-primary)" }}
            >
              {loading ? "Creating…" : "Save & Activate Code"}
            </button>
          </div>
        </form>
      )}

      {/* Coupons Table */}
      <div className="overflow-x-auto rounded-2xl border" style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}>
        <table className="w-full text-left text-xs">
          <thead className="border-b font-bold uppercase tracking-wider text-dim" style={{ backgroundColor: "var(--fc-bg-subtle)", borderColor: "var(--fc-border)" }}>
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Discount</th>
              <th className="px-4 py-3">Thresholds</th>
              <th className="px-4 py-3">Redemptions</th>
              <th className="px-4 py-3">Expiry</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: "var(--fc-border)" }}>
            {coupons.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-dim">
                  No promo coupons found. Click &quot;Create Promo Code&quot; to add one.
                </td>
              </tr>
            ) : (
              coupons.map((c) => (
                <tr key={c.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3.5">
                    <span className="font-mono font-bold text-primary text-sm px-2 py-0.5 rounded border border-dashed" style={{ borderColor: "var(--fc-primary)" }}>
                      {c.code}
                    </span>
                    {c.description && <p className="text-[11px] text-dim mt-1">{c.description}</p>}
                  </td>
                  <td className="px-4 py-3.5 font-bold">
                    {c.discountType === "PERCENTAGE" ? `${c.discountValue}% OFF` : `${formatINR(c.discountValue)} OFF`}
                  </td>
                  <td className="px-4 py-3.5 text-dim">
                    {c.minOrderAmount ? `Min: ${formatINR(c.minOrderAmount)}` : "No min order"}
                    {c.maxDiscountAmount ? ` · Cap: ${formatINR(c.maxDiscountAmount)}` : ""}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="font-semibold">{c.usedCount}</span>
                    {c.usageLimit ? <span className="text-dim"> / {c.usageLimit}</span> : " / ∞"}
                  </td>
                  <td className="px-4 py-3.5 text-dim">
                    {c.endDate ? new Date(c.endDate).toLocaleDateString("en-IN") : "Never"}
                  </td>
                  <td className="px-4 py-3.5">
                    <button
                      onClick={() => toggleActive(c.id, c.isActive)}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase transition-colors ${
                        c.isActive ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-gray-500/15 text-gray-500"
                      }`}
                    >
                      {c.isActive ? "Active" : "Disabled"}
                    </button>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      onClick={() => deleteCoupon(c.id, c.code)}
                      className="text-xs text-rose-500 hover:underline font-semibold"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
