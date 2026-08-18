"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatINR } from "@/lib/format";
import { useToast } from "@/components/providers/ToastProvider";

type Variant = {
  id: string;
  sku: string;
  colour: string;
  size: string;
  price: number | string;
  compareAtPrice: number | string | null;
  stockQuantity: number;
  isActive: boolean;
};

const emptyForm = { sku: "", colour: "", size: "", price: "", compareAtPrice: "", stockQuantity: "10" };

export default function VariantManager({ productId, variants }: { productId: string; variants: Variant[] }) {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function addVariant(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setAdding(true);
    try {
      const res = await fetch(`/api/admin/products/${productId}/variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku: form.sku.trim(),
          colour: form.colour.trim(),
          size: form.size.trim(),
          price: Number(form.price),
          compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : undefined,
          stockQuantity: Number(form.stockQuantity),
        }),
      });
      const data = await res.json();
      setAdding(false);
      if (!res.ok) {
        setError(data.error || "Failed to add variant");
        return;
      }
      setForm(emptyForm);
      success("Variant Added 🎉", `Added SKU ${form.sku}`);
      router.refresh();
    } catch {
      setAdding(false);
      setError("Network error while adding variant");
    }
  }

  async function updateStock(variantId: string, stockQuantity: number) {
    try {
      await fetch(`/api/admin/products/${productId}/variants/${variantId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stockQuantity }),
      });
      success("Stock Updated", `Stock set to ${stockQuantity} units.`);
      router.refresh();
    } catch {
      toastError("Error", "Could not update stock.");
    }
  }

  async function toggleActive(variant: Variant) {
    const nextStatus = !variant.isActive;
    setActionLoading(variant.id);
    try {
      const res = await fetch(`/api/admin/products/${productId}/variants/${variant.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextStatus }),
      });
      setActionLoading(null);
      if (!res.ok) throw new Error("Update failed");

      if (nextStatus) {
        success("Variant Activated 🎉", `SKU "${variant.sku}" is now active and purchasable.`);
      } else {
        success("Variant Deactivated", `SKU "${variant.sku}" is now deactivated.`);
      }
      router.refresh();
    } catch {
      setActionLoading(null);
      toastError("Error", "Could not toggle variant status.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-xs">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-line bg-ivory-deep font-bold uppercase text-[10px] tracking-wider text-ink-soft">
              <th className="px-4 py-3">SKU</th>
              <th className="px-3 py-3">Colour</th>
              <th className="px-3 py-3">Size</th>
              <th className="px-3 py-3">Price</th>
              <th className="px-3 py-3">Stock Quantity</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {variants.map((v) => (
              <tr key={v.id} className={`hover:bg-slate-50/50 transition-colors ${!v.isActive ? "bg-slate-50/70" : ""}`}>
                <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-900">{v.sku}</td>
                <td className="px-3 py-3 font-medium text-slate-700">{v.colour}</td>
                <td className="px-3 py-3 font-bold text-slate-900">{v.size}</td>
                <td className="px-3 py-3">
                  <span className="font-bold text-slate-900">{formatINR(v.price)}</span>
                  {v.compareAtPrice && (
                    <span className="ml-1.5 text-[11px] text-slate-400 line-through">
                      {formatINR(v.compareAtPrice)}
                    </span>
                  )}
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      defaultValue={v.stockQuantity}
                      min={0}
                      className="w-20 rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-mono font-bold focus:outline-hidden focus:border-slate-900"
                      onBlur={(e) => {
                        const val = Number(e.target.value);
                        if (val !== v.stockQuantity) updateStock(v.id, val);
                      }}
                    />
                    <span className="text-[10px] text-slate-400">units</span>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      v.isActive
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-amber-50 text-amber-800 border-amber-300"
                    }`}
                  >
                    {v.isActive ? "● Active" : "○ Inactive / Deactivated"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => toggleActive(v)}
                    disabled={actionLoading === v.id}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer shadow-2xs ${
                      v.isActive
                        ? "bg-white text-rose-600 border-rose-200 hover:bg-rose-50"
                        : "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-xs"
                    }`}
                  >
                    {actionLoading === v.id
                      ? "Updating…"
                      : v.isActive
                      ? "Deactivate"
                      : "✓ Activate Back"}
                  </button>
                </td>
              </tr>
            ))}
            {variants.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-xs">
                  No variants added yet. Use the form below to create your first SKU.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Variant Form */}
      <div className="p-4 rounded-2xl border border-line bg-slate-50 space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
          + Add New SKU / Size Variant
        </p>
        <form onSubmit={addVariant} className="grid grid-cols-2 gap-3 sm:grid-cols-6">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">SKU Code *</label>
            <input
              required
              placeholder="e.g. FC-PRD-01-M"
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-mono focus:outline-hidden focus:border-slate-900"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Colour *</label>
            <input
              required
              placeholder="e.g. Navy Blue"
              value={form.colour}
              onChange={(e) => setForm({ ...form, colour: e.target.value })}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs focus:outline-hidden focus:border-slate-900"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Size *</label>
            <input
              required
              placeholder="e.g. M, L, 3-4 Y"
              value={form.size}
              onChange={(e) => setForm({ ...form, size: e.target.value })}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold focus:outline-hidden focus:border-slate-900"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Price (₹) *</label>
            <input
              required
              type="number"
              placeholder="649"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold focus:outline-hidden focus:border-slate-900"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">MRP / Compare (₹)</label>
            <input
              type="number"
              placeholder="1099"
              value={form.compareAtPrice}
              onChange={(e) => setForm({ ...form, compareAtPrice: e.target.value })}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs focus:outline-hidden focus:border-slate-900"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Initial Stock *</label>
            <input
              required
              type="number"
              placeholder="20"
              value={form.stockQuantity}
              onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold focus:outline-hidden focus:border-slate-900"
            />
          </div>

          <div className="col-span-2 sm:col-span-6 flex justify-end">
            <button
              type="submit"
              disabled={adding}
              className="px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#141416] text-white hover:bg-[#25262B] transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              {adding ? "Adding Variant…" : "+ Create & Save Variant"}
            </button>
          </div>
        </form>
        {error && <p className="text-xs text-rose-600 font-semibold">⚠️ {error}</p>}
      </div>
    </div>
  );
}
