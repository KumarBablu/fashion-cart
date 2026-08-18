"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/providers/ToastProvider";

type Category = {
  id: string;
  name: string;
  slug?: string;
  parentId?: string | null;
};

type ExistingProduct = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  categoryId: string;
  brand: string | null;
  fabric: string | null;
  status: "ACTIVE" | "ARCHIVED" | "DRAFT";
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function ProductForm({
  categories,
  existing,
}: {
  categories: Category[];
  existing?: ExistingProduct;
}) {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [name, setName] = useState(existing?.name ?? "");
  const [slug, setSlug] = useState(existing?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!existing);
  const [description, setDescription] = useState(existing?.description ?? "");
  const [categoryId, setCategoryId] = useState(existing?.categoryId ?? categories[0]?.id ?? "");
  const [brand, setBrand] = useState(existing?.brand ?? "Fashion Cart Atelier");
  const [fabric, setFabric] = useState(existing?.fabric ?? "Pure Fabric");
  const [status, setStatus] = useState<"ACTIVE" | "ARCHIVED" | "DRAFT">(existing?.status ?? "ACTIVE");
  const [isFeatured, setIsFeatured] = useState(existing?.isFeatured ?? false);
  const [isNewArrival, setIsNewArrival] = useState(existing?.isNewArrival ?? true);
  const [isBestSeller, setIsBestSeller] = useState(existing?.isBestSeller ?? false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Group subcategories under parent departments if parentId is present
  const parentCategories = categories.filter((c) => !c.parentId);
  const hasParentChild = parentCategories.length > 0 && categories.some((c) => !!c.parentId);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Product title is required");
      return;
    }
    if (!categoryId) {
      setError("Please select a category for this garment");
      return;
    }

    setSaving(true);
    setError(null);

    const cleanSlug = slug.trim() || slugify(name);
    const payload = {
      name: name.trim(),
      slug: cleanSlug,
      description: description.trim(),
      categoryId,
      brand: brand.trim(),
      fabric: fabric.trim(),
      status,
      isFeatured,
      isNewArrival,
      isBestSeller,
    };

    try {
      const res = existing
        ? await fetch(`/api/products/${existing.slug}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      const data = await res.json();
      setSaving(false);

      if (!res.ok) {
        setError(data.error ?? "Could not save product.");
        toastError("Save Failed", data.error ?? "Could not save product.");
        return;
      }

      success(
        existing ? "Product Updated 🎉" : "Product Created 🎉",
        `"${name}" was saved successfully.`
      );

      if (existing) {
        router.refresh();
      } else {
        router.push(`/admin/products/${data.product.id}`);
      }
    } catch {
      setSaving(false);
      setError("Network error while saving product");
      toastError("Error", "Network error while saving product");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 pb-12">
      {/* Top Action Header */}
      <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <Link
          href="/admin/products"
          className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1.5"
        >
          <span>←</span> Back to Products Catalog
        </Link>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#141416] hover:bg-[#25262B] text-white shadow-md transition-all cursor-pointer disabled:opacity-50"
        >
          {saving ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Saving Product…</span>
            </>
          ) : (
            <>
              <span>✨</span>
              <span>{existing ? "Save Product Changes" : "Save & Continue to Variants →"}</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Main Details Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6 shadow-sm">
        {/* Product Name */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Garment / Product Name *
          </label>
          <input
            required
            placeholder="e.g. Royal Emerald Banarasi Silk Saree, Pure French Linen Shirt"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!slugTouched) setSlug(slugify(e.target.value));
            }}
            className="w-full text-base font-medium px-4 py-3 rounded-xl border border-slate-300 focus:outline-hidden focus:border-[#141416] bg-white transition-all shadow-2xs"
          />
        </div>

        {/* Slug (URL) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Product URL Slug *
            </label>
            <button
              type="button"
              onClick={() => {
                setSlug(slugify(name));
                setSlugTouched(true);
              }}
              className="text-[11px] text-[#C59B27] hover:underline font-semibold cursor-pointer"
            >
              Auto-generate from Name
            </button>
          </div>
          <div className="flex items-center rounded-xl border border-slate-300 bg-slate-50 overflow-hidden">
            <span className="px-3.5 text-xs text-slate-400 font-mono">/products/</span>
            <input
              required
              placeholder="royal-emerald-banarasi-silk-saree"
              value={slug}
              onChange={(e) => {
                setSlug(slugify(e.target.value));
                setSlugTouched(true);
              }}
              className="w-full text-xs font-mono py-3 pr-4 bg-transparent focus:outline-hidden text-slate-900"
            />
          </div>
        </div>

        {/* Category Selector */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Department / Category *
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full text-xs font-medium px-4 py-3 rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:border-[#141416] transition-all shadow-2xs"
          >
            {hasParentChild ? (
              parentCategories.map((parent) => {
                const subs = categories.filter((c) => c.parentId === parent.id);
                return (
                  <optgroup key={parent.id} label={`📁 ${parent.name}`}>
                    <option value={parent.id}>📁 {parent.name} (General Department)</option>
                    {subs.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        &nbsp;&nbsp;&nbsp;&nbsp;↳ {sub.name}
                      </option>
                    ))}
                  </optgroup>
                );
              })
            ) : (
              categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Brand & Fabric */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Brand / Atelier Line
            </label>
            <input
              placeholder="e.g. Fashion Cart Atelier, Luxury Heritage"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="w-full text-xs font-medium px-4 py-3 rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:border-[#141416] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Fabric / Material
            </label>
            <input
              placeholder="e.g. 100% Pure Mulberry Silk, French Linen, Velvet"
              value={fabric}
              onChange={(e) => setFabric(e.target.value)}
              className="w-full text-xs font-medium px-4 py-3 rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:border-[#141416] transition-all"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Garment Story &amp; Description
          </label>
          <textarea
            rows={5}
            placeholder="Detailed description of craftsmanship, weaving techniques, styling recommendations, wash care..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full text-xs font-normal px-4 py-3 rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:border-[#141416] leading-relaxed transition-all"
          />
        </div>

        {/* Status & Merchandising Tags */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Product Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
              className="w-full text-xs font-bold px-4 py-3 rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:border-[#141416]"
            >
              <option value="ACTIVE">🟢 Active (Visible on Storefront)</option>
              <option value="DRAFT">🟡 Draft (Hidden / Work in Progress)</option>
              <option value="ARCHIVED">📦 Archived (Historical Record)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Merchandising Badges
            </label>
            <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-700 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-0"
                />
                <span>👑 Featured</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isNewArrival}
                  onChange={(e) => setIsNewArrival(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-0"
                />
                <span>✨ New Arrival</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isBestSeller}
                  onChange={(e) => setIsBestSeller(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-0"
                />
                <span>🔥 Best Seller</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Prominent Sticky Bottom Save Action Bar */}
      <div className="sticky bottom-6 z-30 flex items-center justify-between gap-4 p-4 rounded-2xl bg-[#141416] text-white shadow-2xl border border-slate-700 animate-in slide-in-from-bottom-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">💾</span>
          <span className="text-xs text-slate-300 font-medium hidden sm:inline">
            {existing ? `Editing "${name || "Garment"}"` : "New Garment Listing"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#C59B27] hover:bg-[#D4A936] text-slate-950 shadow-lg transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Saving Product…</span>
              </>
            ) : (
              <>
                <span>✨</span>
                <span>{existing ? "Save Changes" : "Save & Continue to Variants →"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
