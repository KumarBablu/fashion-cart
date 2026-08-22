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
  specifications?: any;
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
  store = "garments",
}: {
  categories: Category[];
  existing?: ExistingProduct;
  store?: "garments" | "jewellery";
}) {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const isJewellery = store === "jewellery";

  const existingSpecs = (existing?.specifications as Record<string, string>) || {};

  const [productId, setProductId] = useState(existing?.productId ?? "");
  const [name, setName] = useState(existing?.name ?? "");
  const [slug, setSlug] = useState(existing?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!existing);
  const [description, setDescription] = useState(existing?.description ?? "");
  const [categoryId, setCategoryId] = useState(existing?.categoryId ?? categories[0]?.id ?? "");

  // Taxonomy Specs
  const [department, setDepartment] = useState(
    existing?.department ?? (isJewellery ? "Jewellery" : "Women")
  );
  const [subcategory, setSubcategory] = useState(
    existing?.subcategory ?? (isJewellery ? "Kundan Chokers" : "Sarees")
  );
  const [productType, setProductType] = useState(
    existing?.productType ?? existingSpecs.product_type ?? ""
  );
  const [productUrl, setProductUrl] = useState(existing?.productUrl ?? "");
  const [brand, setBrand] = useState(
    existing?.brand ?? (isJewellery ? "Imperial Fine Jewels" : "Fashion Cart Atelier")
  );

  // Garment Attributes
  const [fabric, setFabric] = useState(existing?.fabric ?? (isJewellery ? "" : "Pure Fabric"));
  const [fit, setFit] = useState(existing?.fit ?? (isJewellery ? "Comfort Fit" : "Regular Fit"));
  const [pattern, setPattern] = useState(existing?.pattern ?? "");

  // Common & Jewellery Attributes
  const [material, setMaterial] = useState(
    existing?.material ?? existingSpecs.material_type ?? (isJewellery ? "High-Grade Brass Alloy" : "")
  );
  const [gemType, setGemType] = useState(existingSpecs.gem_type ?? "");
  const [plating, setPlating] = useState(
    existingSpecs.plating ?? (isJewellery ? "24K Micron Gold Plated" : "")
  );
  const [metalType, setMetalType] = useState(
    existingSpecs.metal_type ?? (isJewellery ? "Brass Alloy" : "")
  );
  const [closureType, setClosureType] = useState(existingSpecs.closure_type ?? "");
  const [shape, setShape] = useState(existingSpecs.shape ?? "");
  const [netQty, setNetQty] = useState(existingSpecs.net_qty ?? (isJewellery ? "1 Set" : "1 Unit"));
  const [designType, setDesignType] = useState(existingSpecs.design_type ?? "");
  const [gift, setGift] = useState(existingSpecs.gift ?? "Velvet Gift Box Ready");
  const [keyFeatures, setKeyFeatures] = useState(existingSpecs.key_features ?? "");
  const [occasion, setOccasion] = useState(
    existing?.occasion ?? existingSpecs.occasion ?? (isJewellery ? "Bridal & Wedding" : "Festive & Daily")
  );
  const [availability, setAvailability] = useState(existing?.availability ?? "IN_STOCK");

  // Admin Supplier / Seller Information (Confidential)
  const [sellerName, setSellerName] = useState(
    existing?.sellerName ?? existingSpecs.seller_name ?? ""
  );
  const [sellerIdentifier, setSellerIdentifier] = useState(
    existing?.sellerIdentifier ?? ""
  );
  const [sellerPhone, setSellerPhone] = useState(existing?.sellerPhone ?? "");
  const [sellerEmail, setSellerEmail] = useState(
    existing?.sellerEmail ?? existingSpecs.seller_email ?? ""
  );
  const [sellerAddress, setSellerAddress] = useState(existingSpecs.seller_address ?? "");
  const [sellerLicenseNo, setSellerLicenseNo] = useState(existingSpecs.seller_license_no ?? "");
  const [manufacturerName, setManufacturerName] = useState(
    existingSpecs.manufacturer_or_marketer_name ?? ""
  );
  const [manufacturerAddress, setManufacturerAddress] = useState(
    existingSpecs.manufacturer_or_marketer_address ?? ""
  );
  const [sellerUrl, setSellerUrl] = useState(existing?.sellerUrl ?? "");

  const [status, setStatus] = useState<"ACTIVE" | "ARCHIVED" | "DRAFT">(existing?.status ?? "ACTIVE");
  const [isFeatured, setIsFeatured] = useState(existing?.isFeatured ?? false);
  const [isNewArrival, setIsNewArrival] = useState(existing?.isNewArrival ?? true);
  const [isBestSeller, setIsBestSeller] = useState(existing?.isBestSeller ?? false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Active form section tab
  const [activeTab, setActiveTab] = useState<"CORE" | "SPECS" | "SELLER">("CORE");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Product title is required");
      return;
    }
    if (!categoryId) {
      setError("Please select a category for this item");
      return;
    }

    setSaving(true);
    setError(null);

    const cleanSlug = slug.trim() || slugify(name);
    const categoryPath = `${department} > ${subcategory}`;

    const specifications: Record<string, string> = {
      ...existingSpecs,
      product_type: productType.trim() || subcategory.trim(),
      net_qty: netQty.trim(),
      material_type: material.trim(),
      occasion: occasion.trim(),
      gift: gift.trim(),
      design_type: designType.trim(),
      key_features: keyFeatures.trim(),
    };

    if (isJewellery) {
      if (gemType.trim()) specifications.gem_type = gemType.trim();
      if (plating.trim()) specifications.plating = plating.trim();
      if (metalType.trim()) specifications.metal_type = metalType.trim();
      if (closureType.trim()) specifications.closure_type = closureType.trim();
      if (shape.trim()) specifications.shape = shape.trim();
    }

    if (sellerName.trim()) specifications.seller_name = sellerName.trim();
    if (sellerEmail.trim()) specifications.seller_email = sellerEmail.trim();
    if (sellerAddress.trim()) specifications.seller_address = sellerAddress.trim();
    if (sellerLicenseNo.trim()) specifications.seller_license_no = sellerLicenseNo.trim();
    if (manufacturerName.trim()) specifications.manufacturer_or_marketer_name = manufacturerName.trim();
    if (manufacturerAddress.trim()) specifications.manufacturer_or_marketer_address = manufacturerAddress.trim();

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
      fabric: isJewellery ? null : fabric.trim(),
      material: material.trim() || (isJewellery ? "High-Grade Brass Alloy" : fabric.trim()),
      pattern: isJewellery ? (designType.trim() || "Artisan Kundan") : (pattern.trim() || null),
      fit: isJewellery ? "Comfort Fit" : (fit.trim() || null),
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
      specifications,
    };

    try {
      const endpoint = existing
        ? `/api/products/${existing.slug}?store=${store}`
        : `/api/products?store=${store}`;

      const res = await fetch(endpoint, {
        method: existing ? "PUT" : "POST",
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
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Top Action Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 shadow-xs">
        <Link
          href="/admin/products"
          className="text-xs font-bold text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1.5"
        >
          <span>←</span> Back to Products Catalog
        </Link>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider text-white shadow-md transition-all cursor-pointer disabled:opacity-50 active:scale-95 ${
              isJewellery ? "bg-[#C59B27] hover:bg-[#B0881E]" : "bg-[#141416] hover:bg-[#25262B]"
            }`}
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
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Clean Tabs Navigation Bar */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 w-fit">
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
          {isJewellery ? "💎 Gem, Plating & Jewellery Specs" : "🧵 Fabric, Fit & Fashion Specs"}
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

      {/* TAB 1: PRIMARY DETAILS & CATEGORY */}
      {activeTab === "CORE" && (
        <div className="rounded-3xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-6 sm:p-8 space-y-6 shadow-sm">
          {/* Custom Product ID & Name */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
                Product ID (SKU / Master Code)
              </label>
              <input
                placeholder={isJewellery ? "e.g. PRD-JW-001" : "e.g. PRD-SAR-001"}
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full text-xs font-mono px-4 py-3 rounded-xl border border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 focus:outline-none focus:border-[#C59B27]"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
                {isJewellery ? "Jewellery / Masterpiece Name *" : "Garment / Product Name *"}
              </label>
              <input
                required
                placeholder={
                  isJewellery
                    ? "e.g. Royal Mughal Uncut Kundan & Pearl Bridal Choker Set"
                    : "e.g. Royal Emerald Banarasi Silk Saree, Pure French Linen Shirt"
                }
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!slugTouched) setSlug(slugify(e.target.value));
                }}
                className="w-full text-sm font-semibold px-4 py-3 rounded-xl border border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 focus:outline-none focus:border-[#C59B27]"
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
                onClick={() => setSlug(slugify(name))}
                className="text-[11px] font-bold text-[#C59B27] hover:underline"
              >
                Auto-generate from Name
              </button>
            </div>
            <div className="flex items-center rounded-xl border border-slate-300 dark:border-neutral-600 bg-slate-50 dark:bg-neutral-900 overflow-hidden">
              <span className="px-3.5 py-3 text-xs font-mono text-slate-400 select-none bg-slate-100 dark:bg-neutral-800 border-r border-slate-300 dark:border-neutral-700">
                /products/
              </span>
              <input
                required
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(slugify(e.target.value));
                }}
                placeholder={isJewellery ? "mughal-kundan-bridal-choker-set" : "royal-emerald-banarasi-saree"}
                className="flex-1 px-4 py-3 text-xs font-mono bg-transparent outline-none text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Category & Taxonomy Hierarchy */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
                Category Hierarchy Node *
              </label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full text-xs font-medium px-4 py-3 rounded-xl border border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 focus:outline-none focus:border-[#C59B27]"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.parentId ? `↳ ${c.name}` : `📁 ${c.name}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
                Department / Target
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full text-xs font-medium px-4 py-3 rounded-xl border border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 focus:outline-none focus:border-[#C59B27]"
              >
                {isJewellery ? (
                  <>
                    <option value="Jewellery">Jewellery (All)</option>
                    <option value="Women">Women</option>
                    <option value="Bridal">Bridal</option>
                    <option value="Men">Men</option>
                  </>
                ) : (
                  <>
                    <option value="Women">Women</option>
                    <option value="Men">Men</option>
                    <option value="Kids">Kids</option>
                    <option value="Unisex">Unisex</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
                Subcategory
              </label>
              <input
                placeholder={isJewellery ? "e.g. Kundan Chokers, Openable Kadas" : "e.g. Sarees, Kurtis, Linen Shirts"}
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                className="w-full text-xs font-medium px-4 py-3 rounded-xl border border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 focus:outline-none focus:border-[#C59B27]"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
              Curated Editorial Description
            </label>
            <textarea
              rows={4}
              placeholder={
                isJewellery
                  ? "Describe the craftsmanship, 24K plating quality, stone setting, packaging, and styling recommendations…"
                  : "Describe the fabric drape, handloom weave origin, styling, and artisan craftsmanship…"
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs leading-relaxed px-4 py-3 rounded-xl border border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 focus:outline-none focus:border-[#C59B27]"
            />
          </div>

          {/* Badges & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2 border-t border-slate-100 dark:border-neutral-700">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full text-xs font-bold px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-900"
              >
                <option value="ACTIVE">🟢 Active (Live)</option>
                <option value="DRAFT">🟡 Draft (Hidden)</option>
                <option value="ARCHIVED">🔴 Archived</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="isFeatured"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="h-4 w-4 rounded accent-[#C59B27]"
              />
              <label htmlFor="isFeatured" className="text-xs font-bold text-slate-700 dark:text-neutral-300 cursor-pointer">
                ⭐ Featured Item
              </label>
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="isNewArrival"
                checked={isNewArrival}
                onChange={(e) => setIsNewArrival(e.target.checked)}
                className="h-4 w-4 rounded accent-[#C59B27]"
              />
              <label htmlFor="isNewArrival" className="text-xs font-bold text-slate-700 dark:text-neutral-300 cursor-pointer">
                ✨ New Arrival
              </label>
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="isBestSeller"
                checked={isBestSeller}
                onChange={(e) => setIsBestSeller(e.target.checked)}
                className="h-4 w-4 rounded accent-[#C59B27]"
              />
              <label htmlFor="isBestSeller" className="text-xs font-bold text-slate-700 dark:text-neutral-300 cursor-pointer">
                🔥 Best Seller
              </label>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SPECIFICATIONS */}
      {activeTab === "SPECS" && (
        <div className="rounded-3xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-6 sm:p-8 space-y-6 shadow-sm">
          {isJewellery ? (
            /* JEWELLERY SPECIFICATIONS */
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                💎 Imperial Jewellery Attributes &amp; Quality Parameters
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
                    Gem / Stone Type
                  </label>
                  <input
                    placeholder="e.g. Uncut Kundan & Polki, American Diamond (CZ)"
                    value={gemType}
                    onChange={(e) => setGemType(e.target.value)}
                    className="w-full text-xs px-4 py-3 rounded-xl border border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
                    Plating / Polish
                  </label>
                  <input
                    placeholder="e.g. 24K Micron Gold Plated, Matte Antique"
                    value={plating}
                    onChange={(e) => setPlating(e.target.value)}
                    className="w-full text-xs px-4 py-3 rounded-xl border border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
                    Base Metal &amp; Material
                  </label>
                  <input
                    placeholder="e.g. High-Grade Brass Alloy, Copper Brass"
                    value={material}
                    onChange={(e) => {
                      setMaterial(e.target.value);
                      setMetalType(e.target.value);
                    }}
                    className="w-full text-xs px-4 py-3 rounded-xl border border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
                    Closure Type
                  </label>
                  <input
                    placeholder="e.g. Adjustable Dori, Screw & Hinge, Push Back"
                    value={closureType}
                    onChange={(e) => setClosureType(e.target.value)}
                    className="w-full text-xs px-4 py-3 rounded-xl border border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
                    Shape / Motif
                  </label>
                  <input
                    placeholder="e.g. Peacock Floral Jali, Gajra Filigree"
                    value={shape}
                    onChange={(e) => setShape(e.target.value)}
                    className="w-full text-xs px-4 py-3 rounded-xl border border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
                    Net Quantity
                  </label>
                  <input
                    placeholder="e.g. 1 Set (1 Choker, 2 Earrings, 1 Tikka)"
                    value={netQty}
                    onChange={(e) => setNetQty(e.target.value)}
                    className="w-full text-xs px-4 py-3 rounded-xl border border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
                    Design Style
                  </label>
                  <input
                    placeholder="e.g. Royal Mughal Heirloom, South Indian Temple"
                    value={designType}
                    onChange={(e) => setDesignType(e.target.value)}
                    className="w-full text-xs px-4 py-3 rounded-xl border border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
                    Occasion
                  </label>
                  <input
                    placeholder="e.g. Bridal & Wedding, Festive Glam"
                    value={occasion}
                    onChange={(e) => setOccasion(e.target.value)}
                    className="w-full text-xs px-4 py-3 rounded-xl border border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
                    Gift Ready Packaging
                  </label>
                  <input
                    placeholder="e.g. Velvet Gift Box Ready"
                    value={gift}
                    onChange={(e) => setGift(e.target.value)}
                    className="w-full text-xs px-4 py-3 rounded-xl border border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
                  Key Features &amp; Highlights (Bullet Points)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. 24K Micro-Plated Gold, Hand-set Uncut Kundan, 100% Lead-Free & Hypoallergenic, Anti-Tarnish Coating"
                  value={keyFeatures}
                  onChange={(e) => setKeyFeatures(e.target.value)}
                  className="w-full text-xs px-4 py-3 rounded-xl border border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-900"
                />
              </div>
            </div>
          ) : (
            /* GARMENT SPECIFICATIONS */
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                🧵 Fabric, Textile &amp; Fit Specifications
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
                    Primary Fabric
                  </label>
                  <input
                    placeholder="e.g. Pure Mulberry Silk, French Linen"
                    value={fabric}
                    onChange={(e) => setFabric(e.target.value)}
                    className="w-full text-xs px-4 py-3 rounded-xl border border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
                    Material Composition
                  </label>
                  <input
                    placeholder="e.g. 100% Certified Organic Cotton"
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    className="w-full text-xs px-4 py-3 rounded-xl border border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
                    Fit Type
                  </label>
                  <input
                    placeholder="e.g. Tailored Fit, Relaxed, Regular"
                    value={fit}
                    onChange={(e) => setFit(e.target.value)}
                    className="w-full text-xs px-4 py-3 rounded-xl border border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
                    Pattern &amp; Weave
                  </label>
                  <input
                    placeholder="e.g. Zari Woven Floral, Solid, Striped"
                    value={pattern}
                    onChange={(e) => setPattern(e.target.value)}
                    className="w-full text-xs px-4 py-3 rounded-xl border border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
                    Occasion
                  </label>
                  <input
                    placeholder="e.g. Wedding & Festive, Casual Luxury"
                    value={occasion}
                    onChange={(e) => setOccasion(e.target.value)}
                    className="w-full text-xs px-4 py-3 rounded-xl border border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
                    Net Quantity
                  </label>
                  <input
                    placeholder="e.g. 1 Saree with Unstitched Blouse Piece"
                    value={netQty}
                    onChange={(e) => setNetQty(e.target.value)}
                    className="w-full text-xs px-4 py-3 rounded-xl border border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-900"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SUPPLIER & SELLER (ADMIN CONFIDENTIAL) */}
      {activeTab === "SELLER" && (
        <div className="rounded-3xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/20 dark:bg-amber-950/10 p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
            <span className="text-xl">🔒</span>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider">
                Confidential Supplier &amp; Statutory Compliance Details
              </h3>
              <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80">
                These records are strictly confidential and visible ONLY to Admin accounts. Never exposed to storefront customers.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
                Seller / Supplier Legal Name
              </label>
              <input
                placeholder="e.g. Jaipur Royal Goldsmiths Guild"
                value={sellerName}
                onChange={(e) => setSellerName(e.target.value)}
                className="w-full text-xs font-semibold px-4 py-3 rounded-xl border border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
                Seller License / BIS Hallmark No
              </label>
              <input
                placeholder="e.g. BIS/HM-JW-92847"
                value={sellerLicenseNo}
                onChange={(e) => setSellerLicenseNo(e.target.value)}
                className="w-full text-xs font-mono px-4 py-3 rounded-xl border border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
                Supplier Email
              </label>
              <input
                placeholder="supplier@example.com"
                value={sellerEmail}
                onChange={(e) => setSellerEmail(e.target.value)}
                className="w-full text-xs px-4 py-3 rounded-xl border border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
                Supplier Phone / WhatsApp
              </label>
              <input
                placeholder="+91 9876543210"
                value={sellerPhone}
                onChange={(e) => setSellerPhone(e.target.value)}
                className="w-full text-xs font-mono px-4 py-3 rounded-xl border border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
                Supplier Source Link / URL
              </label>
              <input
                placeholder="https://supplier.example.com/item/..."
                value={sellerUrl || productUrl}
                onChange={(e) => {
                  setSellerUrl(e.target.value);
                  setProductUrl(e.target.value);
                }}
                className="w-full text-xs font-mono px-4 py-3 rounded-xl border border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
              Seller Registered Address
            </label>
            <input
              placeholder="e.g. Johari Bazaar, Jaipur, Rajasthan - 302003"
              value={sellerAddress}
              onChange={(e) => setSellerAddress(e.target.value)}
              className="w-full text-xs px-4 py-3 rounded-xl border border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-amber-200 dark:border-amber-900/40">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
                Manufacturer / Marketer Name
              </label>
              <input
                placeholder="e.g. Imperial Atelier Crafts LLP"
                value={manufacturerName}
                onChange={(e) => setManufacturerName(e.target.value)}
                className="w-full text-xs px-4 py-3 rounded-xl border border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
                Manufacturer Address
              </label>
              <input
                placeholder="e.g. Johari Bazaar, Jaipur, Rajasthan - 302003"
                value={manufacturerAddress}
                onChange={(e) => setManufacturerAddress(e.target.value)}
                className="w-full text-xs px-4 py-3 rounded-xl border border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-900"
              />
            </div>
          </div>
        </div>
      )}

      {/* Bottom Save Action Bar (Flows naturally below form - No Overlap) */}
      <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 shadow-sm mt-8">
        <div className="flex items-center gap-2">
          <span className="text-xl">💾</span>
          <span className="text-xs text-slate-600 dark:text-slate-300 font-bold">
            {existing
              ? `Editing "${name || (isJewellery ? "Jewellery" : "Garment")}"`
              : isJewellery
              ? "New Jewellery Listing"
              : "New Garment Listing"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={saving}
            className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider text-white shadow-md transition-all cursor-pointer disabled:opacity-50 active:scale-95 ${
              isJewellery ? "bg-[#C59B27] hover:bg-[#B0881E]" : "bg-[#141416] hover:bg-[#25262B]"
            }`}
          >
            {saving ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
