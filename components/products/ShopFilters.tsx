"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";
import { formatINR } from "@/lib/format";

type Category = { id: string; name: string; slug: string; parentId: string | null };

const COLOR_SWATCHES: { label: string; query: string; bg: string; border?: string }[] = [
  { label: "Black", query: "Black", bg: "#141416" },
  { label: "White / Ivory", query: "White", bg: "#FAF8F5", border: "#D1D5DB" },
  { label: "Navy / Blue", query: "Blue", bg: "#1E3A8A" },
  { label: "Maroon / Wine", query: "Maroon", bg: "#881337" },
  { label: "Red / Crimson", query: "Red", bg: "#DC2626" },
  { label: "Emerald / Green", query: "Green", bg: "#047857" },
  { label: "Gold / Mustard", query: "Gold", bg: "#C59B27" },
  { label: "Pink / Rose", query: "Rose", bg: "#E11D48" },
  { label: "Beige / Sand", query: "Beige", bg: "#D4C5B9" },
  { label: "Lavender / Plum", query: "Plum", bg: "#6B21A8" },
  { label: "Teal / Turquoise", query: "Teal", bg: "#0D9488" },
  { label: "Multicolour", query: "Multi", bg: "linear-gradient(135deg, #EF4444, #F59E0B, #10B981, #3B82F6)" },
];

const STANDARD_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "Free Size"];
const WAIST_SIZES = ["28", "30", "32", "34", "36", "38"];
const KIDS_SIZES = ["2-3 Y", "3-4 Y", "4-5 Y", "5-6 Y", "6-7 Y", "7-8 Y", "8-9 Y", "9-10 Y"];

const PRICE_TIERS = [
  { label: "Under ₹999", min: null, max: 999 },
  { label: "₹1,000 – ₹1,999", min: 1000, max: 1999 },
  { label: "₹2,000 – ₹2,999", min: 2000, max: 2999 },
  { label: "₹3,000 – ₹4,999", min: 3000, max: 4999 },
  { label: "₹5,000 & Above", min: 5000, max: null },
];

const DEPARTMENT_ICONS: Record<string, string> = {
  women: "🥻",
  men: "👔",
  western: "✨",
  kids: "🧸",
};

export default function ShopFilters({
  categories,
  sizes,
  colours,
}: {
  categories: Category[];
  sizes: string[];
  colours: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sizeTab, setSizeTab] = useState<"standard" | "waist" | "kids">("standard");

  const [customMin, setCustomMin] = useState(searchParams.get("minPrice") || "");
  const [customMax, setCustomMax] = useState(searchParams.get("maxPrice") || "");

  // Expand state for category accordions
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({
    women: true,
    men: true,
    western: true,
    kids: true,
  });

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null || value === "") params.delete(key);
    else params.set(key, value);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  function updatePriceTier(min: number | null, max: number | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (min === null) params.delete("minPrice");
    else params.set("minPrice", min.toString());

    if (max === null) params.delete("maxPrice");
    else params.set("maxPrice", max.toString());

    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  function applyCustomPrice(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (customMin) params.set("minPrice", customMin);
    else params.delete("minPrice");

    if (customMax) params.set("maxPrice", customMax);
    else params.delete("maxPrice");

    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  function clearAllFilters() {
    router.push(pathname);
  }

  const topLevel = categories.filter((c) => !c.parentId);
  const activeCategory = searchParams.get("category");
  const activeSize = searchParams.get("size");
  const activeColour = searchParams.get("colour");
  const activeMinPrice = searchParams.get("minPrice");
  const activeMaxPrice = searchParams.get("maxPrice");
  const inStock = searchParams.get("inStock") === "true";
  const onSale = searchParams.get("onSale") === "true";

  const hasActiveFilters = Boolean(
    activeCategory || activeSize || activeColour || activeMinPrice || activeMaxPrice || inStock || onSale
  );

  const activeCategoryObj = categories.find((c) => c.slug === activeCategory);

  return (
    <aside className="w-full">
      {/* Mobile Filter Toggle Button */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setMobileOpen(true)}
          className="w-full py-3 px-4 rounded-2xl bg-white border border-[#E7DFD5] shadow-xs flex items-center justify-between text-xs font-bold text-[#141416]"
        >
          <div className="flex items-center gap-2">
            <span>⚙️ Filter &amp; Refine</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-[#C59B27]" />
            )}
          </div>
          <span className="text-[#C59B27]">Refine Catalog →</span>
        </button>
      </div>

      {/* Desktop & Mobile Drawer Container */}
      <div
        className={`${
          mobileOpen
            ? "fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
            : "hidden lg:block"
        }`}
      >
        <div
          className={`${
            mobileOpen
              ? "w-full max-w-sm h-full bg-[#FAF8F5] p-6 overflow-y-auto shadow-2xl flex flex-col justify-between"
              : "space-y-6"
          }`}
        >
          {/* Mobile Header */}
          {mobileOpen && (
            <div className="flex items-center justify-between pb-4 border-b border-[#E7DFD5] shrink-0">
              <div className="flex items-center gap-2">
                <h3 className="font-display text-lg font-bold text-[#141416]">Refine Catalog</h3>
                {hasActiveFilters && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#141416] text-white font-bold">
                    Active
                  </span>
                )}
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="w-8 h-8 rounded-full border border-[#E7DFD5] hover:bg-[#F4EFEA] flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>
          )}

          <div className="space-y-6 flex-1">
            
            {/* Active Filters Pill Strip */}
            {hasActiveFilters && (
              <div className="p-3.5 rounded-2xl bg-[#F4EFEA] border border-[#E7DFD5] space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-[#141416]">
                  <span>Active Filters:</span>
                  <button
                    onClick={clearAllFilters}
                    className="text-[#8E6C0C] hover:underline font-bold"
                  >
                    Clear All
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {activeCategoryObj && (
                    <button
                      onClick={() => updateParam("category", null)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white text-[#141416] border border-[#E7DFD5] shadow-xs"
                    >
                      <span>{activeCategoryObj.name}</span>
                      <span className="text-[#787C87] hover:text-rose-600">✕</span>
                    </button>
                  )}
                  {activeColour && (
                    <button
                      onClick={() => updateParam("colour", null)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white text-[#141416] border border-[#E7DFD5] shadow-xs"
                    >
                      <span>Colour: {activeColour}</span>
                      <span className="text-[#787C87] hover:text-rose-600">✕</span>
                    </button>
                  )}
                  {activeSize && (
                    <button
                      onClick={() => updateParam("size", null)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white text-[#141416] border border-[#E7DFD5] shadow-xs"
                    >
                      <span>Size: {activeSize}</span>
                      <span className="text-[#787C87] hover:text-rose-600">✕</span>
                    </button>
                  )}
                  {(activeMinPrice || activeMaxPrice) && (
                    <button
                      onClick={() => updatePriceTier(null, null)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white text-[#141416] border border-[#E7DFD5] shadow-xs"
                    >
                      <span>
                        Price: {activeMinPrice ? formatINR(Number(activeMinPrice)) : "₹0"} -{" "}
                        {activeMaxPrice ? formatINR(Number(activeMaxPrice)) : "Above"}
                      </span>
                      <span className="text-[#787C87] hover:text-rose-600">✕</span>
                    </button>
                  )}
                  {onSale && (
                    <button
                      onClick={() => updateParam("onSale", null)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#FBF4E2] text-[#8E6C0C] border border-[#C59B27]/40 shadow-xs"
                    >
                      <span>✨ On Sale</span>
                      <span className="hover:text-rose-600">✕</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* 🥻 1. Category & Department Tree */}
            <div className="rounded-2xl border border-[#E7DFD5] bg-white p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#E7DFD5]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#141416]">
                  Department &amp; Category
                </h4>
                {activeCategory && (
                  <button
                    onClick={() => updateParam("category", null)}
                    className="text-[10px] text-[#787C87] hover:text-[#141416] underline font-semibold"
                  >
                    Reset
                  </button>
                )}
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => updateParam("category", null)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-between ${
                    !activeCategory
                      ? "bg-[#141416] text-white shadow-xs"
                      : "text-[#141416] hover:bg-[#F4EFEA]"
                  }`}
                >
                  <span>✦ All Categories &amp; Apparel</span>
                  {!activeCategory && <span>✓</span>}
                </button>

                {topLevel.map((cat) => {
                  const isCatActive = activeCategory === cat.slug;
                  const icon = DEPARTMENT_ICONS[cat.slug] || "👗";
                  const children = categories.filter((sub) => sub.parentId === cat.id);
                  const isExpanded = expandedCats[cat.slug] ?? true;

                  return (
                    <div key={cat.id} className="space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <button
                          onClick={() => updateParam("category", isCatActive ? null : cat.slug)}
                          className={`flex-1 text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${
                            isCatActive
                              ? "bg-[#C59B27] text-white shadow-xs"
                              : "text-[#141416] hover:bg-[#F4EFEA]"
                          }`}
                        >
                          <span>{icon}</span>
                          <span className="truncate">{cat.name}</span>
                        </button>
                        {children.length > 0 && (
                          <button
                            onClick={() =>
                              setExpandedCats((prev) => ({
                                ...prev,
                                [cat.slug]: !prev[cat.slug],
                              }))
                            }
                            className="p-2 text-xs text-[#787C87] hover:text-[#141416] transition-colors"
                            aria-label="Toggle subcategories"
                          >
                            {isExpanded ? "▾" : "▸"}
                          </button>
                        )}
                      </div>

                      {/* Subcategories */}
                      {children.length > 0 && isExpanded && (
                        <div className="pl-6 space-y-1 border-l-2 border-[#E7DFD5] ml-3 py-1">
                          {children.map((sub) => {
                            const isSubActive = activeCategory === sub.slug;
                            return (
                              <button
                                key={sub.id}
                                onClick={() => updateParam("category", isSubActive ? null : sub.slug)}
                                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition-colors flex items-center justify-between ${
                                  isSubActive
                                    ? "bg-[#141416] text-white font-bold"
                                    : "text-[#4B4E56] hover:text-[#141416] hover:bg-[#F4EFEA]"
                                }`}
                              >
                                <span className="truncate">{sub.name}</span>
                                {isSubActive && <span className="text-[10px]">✓</span>}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 🎨 2. Visual Colour Swatch Matrix */}
            <div className="rounded-2xl border border-[#E7DFD5] bg-white p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#E7DFD5]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#141416]">
                  Colour Shade
                </h4>
                {activeColour && (
                  <button
                    onClick={() => updateParam("colour", null)}
                    className="text-[10px] text-[#787C87] hover:text-[#141416] underline font-semibold"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {COLOR_SWATCHES.map((swatch) => {
                  const isSelected = activeColour === swatch.query;
                  return (
                    <button
                      key={swatch.label}
                      onClick={() => updateParam("colour", isSelected ? null : swatch.query)}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-[11px] font-medium transition-all text-left border ${
                        isSelected
                          ? "bg-[#141416] text-white border-[#141416] font-bold shadow-xs"
                          : "bg-white text-[#141416] border-[#E7DFD5] hover:bg-[#F4EFEA]"
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
                        style={{
                          background: swatch.bg,
                          border: swatch.border ? `1px solid ${swatch.border}` : "1px solid rgba(0,0,0,0.1)",
                        }}
                      />
                      <span className="truncate">{swatch.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 📏 3. Structured Size Selection */}
            <div className="rounded-2xl border border-[#E7DFD5] bg-white p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#E7DFD5]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#141416]">
                  Garment Size
                </h4>
                {activeSize && (
                  <button
                    onClick={() => updateParam("size", null)}
                    className="text-[10px] text-[#787C87] hover:text-[#141416] underline font-semibold"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Size Tab Switcher */}
              <div className="flex items-center p-1 rounded-xl bg-[#F4EFEA] border border-[#E7DFD5] text-[10px] font-bold">
                <button
                  onClick={() => setSizeTab("standard")}
                  className={`flex-1 py-1 text-center rounded-lg transition-colors ${
                    sizeTab === "standard" ? "bg-white text-[#141416] shadow-xs" : "text-[#787C87]"
                  }`}
                >
                  Standard
                </button>
                <button
                  onClick={() => setSizeTab("waist")}
                  className={`flex-1 py-1 text-center rounded-lg transition-colors ${
                    sizeTab === "waist" ? "bg-white text-[#141416] shadow-xs" : "text-[#787C87]"
                  }`}
                >
                  Waist / Jeans
                </button>
                <button
                  onClick={() => setSizeTab("kids")}
                  className={`flex-1 py-1 text-center rounded-lg transition-colors ${
                    sizeTab === "kids" ? "bg-white text-[#141416] shadow-xs" : "text-[#787C87]"
                  }`}
                >
                  Kids Age
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {(sizeTab === "standard"
                  ? STANDARD_SIZES
                  : sizeTab === "waist"
                  ? WAIST_SIZES
                  : KIDS_SIZES
                ).map((sz) => {
                  const isSelected = activeSize === sz;
                  return (
                    <button
                      key={sz}
                      onClick={() => updateParam("size", isSelected ? null : sz)}
                      className={`min-w-9 h-8 px-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center ${
                        isSelected
                          ? "bg-[#141416] text-white border-[#141416] shadow-xs scale-105"
                          : "bg-white text-[#141416] border-[#E7DFD5] hover:bg-[#F4EFEA] hover:border-[#C59B27]/60"
                      }`}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 💰 4. Curated Price Tiers & Custom Range */}
            <div className="rounded-2xl border border-[#E7DFD5] bg-white p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#E7DFD5]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#141416]">
                  Price Range
                </h4>
                {(activeMinPrice || activeMaxPrice) && (
                  <button
                    onClick={() => updatePriceTier(null, null)}
                    className="text-[10px] text-[#787C87] hover:text-[#141416] underline font-semibold"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Quick Tiers */}
              <div className="space-y-1.5">
                {PRICE_TIERS.map((tier) => {
                  const isSelected =
                    (tier.min === null ? !activeMinPrice : activeMinPrice === tier.min.toString()) &&
                    (tier.max === null ? !activeMaxPrice : activeMaxPrice === tier.max.toString());

                  return (
                    <button
                      key={tier.label}
                      onClick={() =>
                        isSelected ? updatePriceTier(null, null) : updatePriceTier(tier.min, tier.max)
                      }
                      className={`w-full text-left px-3 py-1.5 rounded-xl text-xs transition-colors flex items-center justify-between ${
                        isSelected
                          ? "bg-[#FBF4E2] text-[#8E6C0C] font-bold border border-[#C59B27]/40"
                          : "text-[#4B4E56] hover:bg-[#F4EFEA] hover:text-[#141416]"
                      }`}
                    >
                      <span>{tier.label}</span>
                      {isSelected && <span className="text-[10px]">✓</span>}
                    </button>
                  );
                })}
              </div>

              {/* Custom Min / Max Input Form */}
              <form onSubmit={applyCustomPrice} className="pt-2 border-t border-[#E7DFD5] space-y-2">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-[#787C87] uppercase font-bold block mb-1">
                      Min (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={customMin}
                      onChange={(e) => setCustomMin(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#E7DFD5] text-xs outline-none focus:border-[#C59B27]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#787C87] uppercase font-bold block mb-1">
                      Max (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="10000"
                      value={customMax}
                      onChange={(e) => setCustomMax(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#E7DFD5] text-xs outline-none focus:border-[#C59B27]"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-[#141416] text-white hover:bg-[#25262B] transition-colors"
                >
                  Apply Price Range
                </button>
              </form>
            </div>

            {/* ✨ 5. Availability & Deals Toggle */}
            <div className="rounded-2xl border border-[#E7DFD5] bg-white p-4 space-y-2.5 shadow-xs">
              <label className="flex items-center gap-2.5 text-xs font-semibold text-[#141416] cursor-pointer">
                <input
                  type="checkbox"
                  checked={onSale}
                  onChange={(e) => updateParam("onSale", e.target.checked ? "true" : null)}
                  className="w-4 h-4 rounded border-[#E7DFD5] text-[#C59B27] accent-[#C59B27] cursor-pointer"
                />
                <span>✨ On Sale / Special Offers</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs font-semibold text-[#141416] cursor-pointer">
                <input
                  type="checkbox"
                  checked={inStock}
                  onChange={(e) => updateParam("inStock", e.target.checked ? "true" : null)}
                  className="w-4 h-4 rounded border-[#E7DFD5] text-[#C59B27] accent-[#C59B27] cursor-pointer"
                />
                <span>📦 In Stock (Ready to Ship)</span>
              </label>
            </div>

          </div>

          {/* Mobile Bottom Apply Button */}
          {mobileOpen && (
            <div className="pt-4 border-t border-[#E7DFD5] shrink-0">
              <button
                onClick={() => setMobileOpen(false)}
                className="w-full py-3 rounded-full font-bold text-xs uppercase tracking-wider bg-[#141416] text-white shadow-md"
              >
                Apply Filters &amp; View Outfits →
              </button>
            </div>
          )}

        </div>
      </div>
    </aside>
  );
}
