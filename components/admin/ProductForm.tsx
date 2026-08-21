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
  productId?: string | null;
  name: string;
  slug: string;
  description: string | null;
  categoryId: string;
  department?: string | null;
  subcategory?: string | null;
  categoryPath?: string | null;
  productType?: string | null;
  productUrl?: string | null;
  brand: string | null;
  fabric: string | null;
  material?: string | null;
  pattern?: string | null;
  fit?: string | null;
  occasion?: string | null;
  availability?: string | null;
  currency?: string | null;
  sellerName?: string | null;
  sellerIdentifier?: string | null;
  sellerPhone?: string | null;
  sellerEmail?: string | null;
  sellerUrl?: string | null;
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

  const [productId, setProductId] = useState(existing?.productId ?? "");
  const [name, setName] = useState(existing?.name ?? "");
  const [slug, setSlug] = useState(existing?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!existing);
  const [description, setDescription] = useState(existing?.description ?? "");
  const [categoryId, setCategoryId] = useState(existing?.categoryId ?? categories[0]?.id ?? "");

  // Fashion & Taxonomy Specs
  const [department, setDepartment] = useState(existing?.department ?? "Women");
  const [subcategory, setSubcategory] = useState(existing?.subcategory ?? "Sarees");
  const [productType, setProductType] = useState(existing?.productType ?? "");
  const [productUrl, setProductUrl] = useState(existing?.productUrl ?? "");
  const [brand, setBrand] = useState(existing?.brand ?? "Fashion Cart Atelier");
  const [fabric, setFabric] = useState(existing?.fabric ?? "Pure Fabric");
  const [material, setMaterial] = useState(existing?.material ?? "");
  const [pattern, setPattern] = useState(existing?.pattern ?? "");
  const [fit, setFit] = useState(existing?.fit ?? "");
  const [occasion, setOccasion] = useState(existing?.occasion ?? "");
  const [availability, setAvailability] = useState(existing?.availability ?? "IN_STOCK");

  // Admin Supplier / Seller Information (Confidential)
  const [sellerName, setSellerName] = useState(existing?.sellerName ?? "");
  const [sellerIdentifier, setSellerIdentifier] = useState(existing?.sellerIdentifier ?? "");
  const [sellerPhone, setSellerPhone] = useState(existing?.sellerPhone ?? "");
  const [sellerEmail, setSellerEmail] = useState(existing?.sellerEmail ?? "");
  const [sellerUrl, setSellerUrl] = useState(existing?.sellerUrl ?? "");

  const [status, setStatus] = useState<"ACTIVE" | "ARCHIVED" | "DRAFT">(existing?.status ?? "ACTIVE");
  const [isFeatured, setIsFeatured] = useState(existing?.isFeatured ?? false);
  const [isNewArrival, setIsNewArrival] = useState(existing?.isNewArrival ?? true);
  const [isBestSeller, setIsBestSeller] = useState(existing?.isBestSeller ?? false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Active form section tab
  const [activeTab, setActiveTab] = useState<"CORE" | "SPECS" | "SELLER">("CORE");

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
    const categoryPath = `${department} > ${subcategory}`;

    const payload = {
      productId: productId.trim() || null,
      name: name.trim(),
      slug: cleanSlug,
      description: description.trim(),
      categoryId,
      department: department.trim(),
      subcategory: subcategory.trim(),
      categoryPath,
      productType: productType.trim() || subcategory.trim(),
      productUrl: productUrl.trim() || null,
      brand: brand.trim(),
      fabric: fabric.trim(),
      material: material.trim() || fabric.trim(),
      pattern: pattern.trim() || null,
      fit: fit.trim() || null,
      occasion: occasion.trim() || null,
      availability,
      sellerName: sellerName.trim() || null,
      sellerIdentifier: sellerIdentifier.trim() || null,
      sellerPhone: sellerPhone.trim() || null,
      sellerEmail: sellerEmail.trim() || null,
      sellerUrl: sellerUrl.trim() || null,
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
      <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 shadow-xs">
        <Link
          href="/admin/products"
          className="text-xs font-bold text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1.5"
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

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("CORE")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "CORE"
              ? "bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-xs"
              : "text-slate-600 dark:text-neutral-400 hover:text-slate-900"
          }`}
        >
          🏷️ Primary Details &amp; Category
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("SPECS")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "SPECS"
              ? "bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-xs"
              : "text-slate-600 dark:text-neutral-400 hover:text-slate-900"
          }`}
        >
          🧵 Fabric, Fit &amp; Fashion Specs
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("SELLER")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "SELLER"
              ? "bg-white dark:bg-neutral-800 text-amber-800 dark:text-amber-300 shadow-xs"
              : "text-slate-600 dark:text-neutral-400 hover:text-slate-900"
          }`}
        >
          🔒 Supplier &amp; Seller (Admin Only)
        </button>
      </div>

      {/* TAB 1: PRIMARY DETAILS */}
      {activeTab === "CORE" && (
        <div className="rounded-3xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-6 sm:p-8 space-y-6 shadow-sm">
          {/* Custom Product ID & Name */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
                Product ID (SKU / Master Code)
              </label>
              <input
                placeholder="e.g. PRD-SAR-001"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full text-xs font-mono px-4 py-3 rounded-xl border border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 focus:outline-hidden focus:border-[#141416]"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
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
                className="w-full text-sm font-medium px-4 py-3 rounded-xl border border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 focus:outline-hidden focus:border-[#141416]"
              />
            </div>
          </div>

          {/* Slug (URL) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300">
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
            <div className="flex items-center rounded-xl border border-slate-300 dark:border-neutral-600 bg-slate-50 dark:bg-neutral-900 overflow-hidden">
              <span className="px-3.5 text-xs text-slate-400 font-mono">/products/</span>
              <input
                required
                placeholder="royal-emerald-banarasi-silk-saree"
                value={slug}
                onChange={(e) => {
                  setSlug(slugify(e.target.value));
                  setSlugTouched(true);
                }}
                className="w-full text-xs font-mono py-3 pr-4 bg-transparent focus:outline-hidden text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Category Selector & Taxonomy */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
                Category Hierarchy Node *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full text-xs font-medium px-4 py-3 rounded-xl border border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 focus:outline-hidden focus:border-[#141416]"
              >
                {hasParentChild ? (
                  parentCategories.map((parent) => {
                    const subs = categories.filter((c) => c.parentId === parent.id);
                    return (
                      <optgroup key={parent.id} label={`📁 ${parent.name}`}>
                        <option value={parent.id}>📁 {parent.name} (General)</option>
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

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
                Department / Target
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full text-xs font-medium px-4 py-3 rounded-xl border border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 focus:outline-hidden"
              >
                <option value="Women">Women</option>
                <option value="Men">Men</option>
                <option value="Kids">Kids</option>
                <option value="Boys">Boys</option>
                <option value="Girls">Girls</option>
                <option value="Footwear">Footwear</option>
                <option value="Unisex">Unisex / Accessories</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
                Subcategory
              </label>
              <input
                placeholder="e.g. Sarees, Dresses, Shirts, Kurtas, Jeans, Footwear"
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                className="w-full text-xs font-medium px-4 py-3 rounded-xl border border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
              Garment Story &amp; Description
            </label>
            <textarea
              rows={4}
              placeholder="Detailed description of craftsmanship, weaving techniques, styling recommendations, wash care..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs font-normal px-4 py-3 rounded-xl border border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 focus:outline-hidden leading-relaxed"
            />
          </div>

          {/* Status & Merchandising Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t border-slate-100 dark:border-neutral-700">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
                Product Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as typeof status)}
                className="w-full text-xs font-bold px-4 py-3 rounded-xl border border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 focus:outline-hidden"
              >
                <option value="ACTIVE">🟢 Active (Visible on Storefront)</option>
                <option value="DRAFT">🟡 Draft (Hidden / Work in Progress)</option>
                <option value="ARCHIVED">📦 Archived (Historical Record)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-2">
                Merchandising Badges
              </label>
              <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-700 dark:text-neutral-300 pt-1">
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
      )}

      {/* TAB 2: FABRIC & FASHION SPECS */}
      {activeTab === "SPECS" && (
        <div className="rounded-3xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
                Brand / Designer
              </label>
              <input
                placeholder="e.g. Fashion Cart Atelier"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full text-xs font-medium px-4 py-3 rounded-xl border border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
                Fabric
              </label>
              <input
                placeholder="e.g. 100% Pure Mulberry Silk, French Linen"
                value={fabric}
                onChange={(e) => setFabric(e.target.value)}
                className="w-full text-xs font-medium px-4 py-3 rounded-xl border border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
                Material Composition
              </label>
              <input
                placeholder="e.g. Pure Katan Silk with Metallic Zari"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                className="w-full text-xs font-medium px-4 py-3 rounded-xl border border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
                Pattern / Print
              </label>
              <input
                placeholder="e.g. Zari Woven, Floral, Solid, Striped"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                className="w-full text-xs font-medium px-4 py-3 rounded-xl border border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
                Fit / Cut
              </label>
              <input
                placeholder="e.g. Slim Fit, Regular Fit, Flared"
                value={fit}
                onChange={(e) => setFit(e.target.value)}
                className="w-full text-xs font-medium px-4 py-3 rounded-xl border border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
                Occasion / Wear
              </label>
              <input
                placeholder="e.g. Wedding & Festive, Casual, Party"
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
                className="w-full text-xs font-medium px-4 py-3 rounded-xl border border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
                Product Type / Style
              </label>
              <input
                placeholder="e.g. Banarasi Silk Saree, Casual Shirt"
                value={productType}
                onChange={(e) => setProductType(e.target.value)}
                className="w-full text-xs font-medium px-4 py-3 rounded-xl border border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
                Stock Availability
              </label>
              <select
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                className="w-full text-xs font-medium px-4 py-3 rounded-xl border border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 focus:outline-hidden"
              >
                <option value="IN_STOCK">In Stock</option>
                <option value="OUT_OF_STOCK">Out of Stock</option>
                <option value="MADE_TO_ORDER">Made to Order / Custom</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CONFIDENTIAL SELLER / SUPPLIER DETAILS (ADMIN ONLY) */}
      {activeTab === "SELLER" && (
        <div className="rounded-3xl border border-amber-200 dark:border-amber-900/50 bg-amber-500/5 dark:bg-amber-950/20 p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex items-center gap-2 border-b border-amber-200 dark:border-amber-800 pb-3">
            <span className="text-xl">🔒</span>
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-amber-900 dark:text-amber-300">
                Confidential Supplier / Seller Details (Admin Only)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                These details are never shown to customers. When an order arrives, you can quickly contact this seller to fulfill inventory.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
                Seller / Supplier Name
              </label>
              <input
                placeholder="e.g. Varanasi Heritage Silks, Surat Textile Mills"
                value={sellerName}
                onChange={(e) => setSellerName(e.target.value)}
                className="w-full text-xs font-medium px-4 py-3 rounded-xl border border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
                Seller ID / Vendor Code
              </label>
              <input
                placeholder="e.g. SLR-VNS-101"
                value={sellerIdentifier}
                onChange={(e) => setSellerIdentifier(e.target.value)}
                className="w-full text-xs font-mono px-4 py-3 rounded-xl border border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
                Seller Mobile / WhatsApp
              </label>
              <input
                placeholder="e.g. +91 9876543210"
                value={sellerPhone}
                onChange={(e) => setSellerPhone(e.target.value)}
                className="w-full text-xs font-mono px-4 py-3 rounded-xl border border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
                Seller Email
              </label>
              <input
                placeholder="supplier@example.com"
                value={sellerEmail}
                onChange={(e) => setSellerEmail(e.target.value)}
                className="w-full text-xs font-medium px-4 py-3 rounded-xl border border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
                Seller / Source URL
              </label>
              <input
                placeholder="https://supplier.example.com/item/..."
                value={sellerUrl || productUrl}
                onChange={(e) => {
                  setSellerUrl(e.target.value);
                  setProductUrl(e.target.value);
                }}
                className="w-full text-xs font-mono px-4 py-3 rounded-xl border border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 focus:outline-hidden"
              />
            </div>
          </div>
        </div>
      )}

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
