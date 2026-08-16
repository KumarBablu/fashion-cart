"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatINR } from "@/lib/format";

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

const emptyForm = { sku: "", colour: "", size: "", price: "", compareAtPrice: "", stockQuantity: "0" };

export default function VariantManager({ productId, variants }: { productId: string; variants: Variant[] }) {
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  async function addVariant(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setAdding(true);
    const res = await fetch(`/api/admin/products/${productId}/variants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sku: form.sku,
        colour: form.colour,
        size: form.size,
        price: Number(form.price),
        compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : undefined,
        stockQuantity: Number(form.stockQuantity),
      }),
    });
    const data = await res.json();
    setAdding(false);
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setForm(emptyForm);
    router.refresh();
  }

  async function updateStock(variantId: string, stockQuantity: number) {
    await fetch(`/api/admin/products/${productId}/variants/${variantId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stockQuantity }),
    });
    router.refresh();
  }

  async function deactivate(variantId: string) {
    await fetch(`/api/admin/products/${productId}/variants/${variantId}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-line">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-ivory-deep text-left text-xs uppercase tracking-wide text-ink-soft">
              <th className="px-3 py-2">SKU</th>
              <th className="px-3 py-2">Colour</th>
              <th className="px-3 py-2">Size</th>
              <th className="px-3 py-2">Price</th>
              <th className="px-3 py-2">Stock</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {variants.map((v) => (
              <tr key={v.id} className={`border-b border-line last:border-0 ${!v.isActive ? "opacity-40" : ""}`}>
                <td className="px-3 py-2 font-mono text-xs">{v.sku}</td>
                <td className="px-3 py-2">{v.colour}</td>
                <td className="px-3 py-2">{v.size}</td>
                <td className="px-3 py-2">
                  {formatINR(v.price)}
                  {v.compareAtPrice && <span className="ml-1 text-xs text-ink-soft line-through">{formatINR(v.compareAtPrice)}</span>}
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    defaultValue={v.stockQuantity}
                    min={0}
                    className="w-16 rounded-md border border-line px-2 py-1 text-xs"
                    onBlur={(e) => {
                      const val = Number(e.target.value);
                      if (val !== v.stockQuantity) updateStock(v.id, val);
                    }}
                  />
                </td>
                <td className="px-3 py-2 text-right">
                  {v.isActive && (
                    <button onClick={() => deactivate(v.id)} className="text-xs text-fc-red hover:underline">
                      Deactivate
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {variants.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-ink-soft">No variants yet — add one below.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <form onSubmit={addVariant} className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-6">
        <input required placeholder="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="rounded-md border border-line px-2 py-1.5 text-xs" />
        <input required placeholder="Colour" value={form.colour} onChange={(e) => setForm({ ...form, colour: e.target.value })} className="rounded-md border border-line px-2 py-1.5 text-xs" />
        <input required placeholder="Size" value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} className="rounded-md border border-line px-2 py-1.5 text-xs" />
        <input required type="number" placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="rounded-md border border-line px-2 py-1.5 text-xs" />
        <input type="number" placeholder="Compare-at price" value={form.compareAtPrice} onChange={(e) => setForm({ ...form, compareAtPrice: e.target.value })} className="rounded-md border border-line px-2 py-1.5 text-xs" />
        <input required type="number" placeholder="Stock" value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })} className="rounded-md border border-line px-2 py-1.5 text-xs" />
        <button disabled={adding} className="col-span-2 sm:col-span-6 rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white w-fit disabled:opacity-50">
          {adding ? "Adding…" : "+ Add variant"}
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-fc-red">{error}</p>}
    </div>
  );
}
