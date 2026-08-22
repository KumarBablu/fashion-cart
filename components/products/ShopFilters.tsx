"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";
import { formatINR } from "@/lib/format";

type Category = { id: string; name: string; slug: string; parentId: string | null };

const GARMENT_COLOR_SWATCHES: { label: string; query: string; bg: string; border?: string }[] = [
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

const JEWELLERY_COLOR_SWATCHES: { label: string; query: string; bg: string; border?: string }[] = [
  { label: "24K Micro Gold", query: "Gold", bg: "#D4AF37" },
  { label: "Antique Matte Gold", query: "Antique Gold", bg: "#B8860B" },
  { label: "Silver / Rhodium", query: "Silver", bg: "#E5E7EB", border: "#9CA3AF" },
  { label: "Rose Gold", query: "Rose Gold", bg: "#E0A899" },
  { label: "Kundan / Pearl", query: "White", bg: "#FAF8F5", border: "#D1D5DB" },
  { label: "Ruby Pink / Red", query: "Ruby", bg: "#9F1239" },
  { label: "Emerald Green", query: "Emerald", bg: "#065F46" },
  { label: "Multicolour Meena", query: "Multi", bg: "linear-gradient(135deg, #EF4444, #F59E0B, #10B981, #3B82F6)" },
  { label: "Black Oxidised", query: "Black", bg: "#1F2937" },
];

const STANDARD_GARMENT_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "Free Size"];
const WAIST_SIZES = ["28", "30", "32", "34", "36", "38"];
const KIDS_SIZES = ["2-3 Y", "3-4 Y", "4-5 Y", "5-6 Y", "6-7 Y", "7-8 Y", "8-9 Y", "9-10 Y"];

// Jewellery Specific Sizes
const BANGLE_SIZES = ["2.4 (Small)", "2.6 (Medium)", "2.8 (Large)", "Openable / Free Size"];
const RING_SIZES = ["Adjustable Band", "Size 12", "Size 14", "Size 16", "Size 18", "Size 20"];
const NECKLACE_SIZES = ["One Size", "Free Size (Adjustable Dori)"];

const GARMENT_PRICE_TIERS = [
  { label: "Under ₹999", min: null, max: 999 },
  { label: "₹1,000 – ₹1,999", min: 1000, max: 1999 },
  { label: "₹2,000 – ₹2,999", min: 2000, max: 2999 },
  { label: "₹3,000 – ₹4,999", min: 3000, max: 4999 },
  { label: "₹5,000 & Above", min: 5000, max: null },
];

const JEWELLERY_PRICE_TIERS = [
  { label: "Under ₹499", min: null, max: 499 },
  { label: "₹500 – ₹999", min: 500, max: 999 },
  { label: "₹1,000 – ₹1,999", min: 1000, max: 1999 },
  { label: "₹2,000 – ₹3,499", min: 2000, max: 3499 },
  { label: "₹3,500 & Above", min: 3500, max: null },
];

const DEPARTMENT_ICONS: Record<string, string> = {
  women: "🥻",
  men: "👔",
  western: "✨",
  kids: "🧸",
  "necklaces-sets": "👑",
  "earrings-jhumkas": "✨",
  "bangles-kadas": "💍",
  rings: "💎",
  "bridal-accents": "👰",
  "mens-jewellery": "🤴",
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

  const isJewellery = pathname.startsWith("/jewellery") || searchParams?.get("store") === "jewellery";

  // Sizing tabs
  const [garmentSizeTab, setGarmentSizeTab] = useState<"standard" | "waist" | "kids">("standard");
  const [jewellerySizeTab, setJewellerySizeTab] = useState<"bangles" | "rings" | "all">("bangles");

  const [customMin, setCustomMin] = useState(searchParams.get("minPrice") || "");
  const [customMax, setCustomMax] = useState(searchParams.get("maxPrice") || "");

  // Expand state for category accordions
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({
    women: true,
    men: true,
    western: true,
    kids: true,
    "necklaces-sets": true,
    "earrings-jhumkas": true,
    "bangles-kadas": true,
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
    if (isJewellery) {
      router.push(`${pathname}?store=jewellery`);
    } else {
      router.push(pathname);
    }
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
  const colorSwatches = isJewellery ? JEWELLERY_COLOR_SWATCHES : GARMENT_COLOR_SWATCHES;
  const priceTiers = isJewellery ? JEWELLERY_PRICE_TIERS : GARMENT_PRICE_TIERS;

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
                      <span>Finish: {activeColour}</span>
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
                  {inStock && (
                    <button
                      onClick={() => updateParam("inStock", null)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs"
                    >
                      <span>In Stock</span>
                      <span className="hover:text-rose-600">✕</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* 🏷️ 1. Category Tree Filter */}
            <div className="rounded-2xl border border-[#E7DFD5] bg-white p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#E7DFD5]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#141416]">
                  {isJewellery ? "Jewellery Collections" : "Department & Category"}
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
                  <span>{isJewellery ? "✦ All Jewellery Pieces" : "✦ All Categories & Apparel"}</span>
                  {!activeCategory && <span>✓</span>}
                </button>

                {topLevel.map((cat) => {
                  const isCatActive = activeCategory === cat.slug;
                  const icon = DEPARTMENT_ICONS[cat.slug] || (isJewellery ? "💍" : "👗");
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

            {/* 🎨 2. Visual Colour / Polish Swatch Matrix */}
            <div className="rounded-2xl border border-[#E7DFD5] bg-white p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#E7DFD5]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#141416]">
                  {isJewellery ? "Plating & Gem Polish" : "Colour Shade"}
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
                {colorSwatches.map((swatch) => {
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

            {/* 📏 3. Structured Size Selection (Jewellery vs Garment) */}
            <div className="rounded-2xl border border-[#E7DFD5] bg-white p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#E7DFD5]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#141416]">
                  {isJewellery ? "Jewellery Size & Fit" : "Garment Size"}
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

              {isJewellery ? (
                /* JEWELLERY SIZING TABS */
                <div className="space-y-2">
                  <div className="flex items-center p-1 rounded-xl bg-[#F4EFEA] border border-[#E7DFD5] text-[10px] font-bold">
                    <button
                      onClick={() => setJewellerySizeTab("bangles")}
                      className={`flex-1 py-1 text-center rounded-lg transition-colors ${
                        jewellerySizeTab === "bangles" ? "bg-white text-[#141416] shadow-xs" : "text-[#787C87]"
                      }`}
                    >
                      Bangles
                    </button>
                    <button
                      onClick={() => setJewellerySizeTab("rings")}
                      className={`flex-1 py-1 text-center rounded-lg transition-colors ${
                        jewellerySizeTab === "rings" ? "bg-white text-[#141416] shadow-xs" : "text-[#787C87]"
                      }`}
                    >
                      Rings
                    </button>
                    <button
                      onClick={() => setJewellerySizeTab("all")}
                      className={`flex-1 py-1 text-center rounded-lg transition-colors ${
                        jewellerySizeTab === "all" ? "bg-white text-[#141416] shadow-xs" : "text-[#787C87]"
                      }`}
                    >
                      All / Sets
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(jewellerySizeTab === "bangles"
                      ? BANGLE_SIZES
                      : jewellerySizeTab === "rings"
                      ? RING_SIZES
                      : NECKLACE_SIZES
                    ).map((sz) => {
                      const queryVal = sz.split(" ")[0]; // e.g. "2.4" or "Adjustable" or "One"
                      const isSelected = activeSize === queryVal || activeSize === sz;
                      return (
                        <button
                          key={sz}
                          onClick={() => updateParam("size", isSelected ? null : queryVal)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center ${
                            isSelected
                              ? "bg-[#C59B27] text-white border-[#C59B27] shadow-xs scale-105"
                              : "bg-white text-[#141416] border-[#E7DFD5] hover:bg-[#F4EFEA] hover:border-[#C59B27]/60"
                          }`}
                        >
                          {sz}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* GARMENT SIZING TABS */
                <div className="space-y-2">
                  <div className="flex items-center p-1 rounded-xl bg-[#F4EFEA] border border-[#E7DFD5] text-[10px] font-bold">
                    <button
                      onClick={() => setGarmentSizeTab("standard")}
                      className={`flex-1 py-1 text-center rounded-lg transition-colors ${
                        garmentSizeTab === "standard" ? "bg-white text-[#141416] shadow-xs" : "text-[#787C87]"
                      }`}
                    >
                      Standard
                    </button>
                    <button
                      onClick={() => setGarmentSizeTab("waist")}
                      className={`flex-1 py-1 text-center rounded-lg transition-colors ${
                        garmentSizeTab === "waist" ? "bg-white text-[#141416] shadow-xs" : "text-[#787C87]"
                      }`}
                    >
                      Waist / Jeans
                    </button>
                    <button
                      onClick={() => setGarmentSizeTab("kids")}
                      className={`flex-1 py-1 text-center rounded-lg transition-colors ${
                        garmentSizeTab === "kids" ? "bg-white text-[#141416] shadow-xs" : "text-[#787C87]"
                      }`}
                    >
                      Kids Age
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(garmentSizeTab === "standard"
                      ? STANDARD_GARMENT_SIZES
                      : garmentSizeTab === "waist"
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
              )}
            </div>

            {/* 💰 4. Price Tiers & Custom Range */}
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
                    Reset
                  </button>
                )}
              </div>

              <div className="space-y-1.5">
                {priceTiers.map((tier) => {
                  const isSelected =
                    (tier.min === null
                      ? !activeMinPrice
                      : activeMinPrice === tier.min.toString()) &&
                    (tier.max === null
                      ? !activeMaxPrice
                      : activeMaxPrice === tier.max.toString());

                  return (
                    <button
                      key={tier.label}
                      onClick={() => updatePriceTier(isSelected ? null : tier.min, isSelected ? null : tier.max)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-between ${
                        isSelected
                          ? "bg-[#141416] text-white font-bold shadow-xs"
                          : "text-[#4B4E56] hover:text-[#141416] hover:bg-[#F4EFEA]"
                      }`}
                    >
                      <span>{tier.label}</span>
                      {isSelected && <span>✓</span>}
                    </button>
                  );
                })}
              </div>

              {/* Custom Min / Max Input Form */}
              <form onSubmit={applyCustomPrice} className="pt-2 border-t border-[#E7DFD5] space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-[#787C87] block mb-1">MIN (₹)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={customMin}
                      onChange={(e) => setCustomMin(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#E7DFD5] text-xs text-[#141416] focus:outline-none focus:border-[#C59B27]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#787C87] block mb-1">MAX (₹)</label>
                    <input
                      type="number"
                      placeholder="10000"
                      value={customMax}
                      onChange={(e) => setCustomMax(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#E7DFD5] text-xs text-[#141416] focus:outline-none focus:border-[#C59B27]"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-2 rounded-xl bg-[#141416] hover:bg-[#25262B] text-white text-[11px] font-bold uppercase tracking-wider transition-colors shadow-xs"
                >
                  Apply Price Range
                </button>
              </form>
            </div>

            {/* ✨ 5. Quality & Stock Status Toggles */}
            <div className="rounded-2xl border border-[#E7DFD5] bg-white p-4 space-y-2.5 shadow-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#141416] pb-2 border-b border-[#E7DFD5]">
                Availability &amp; Offers
              </h4>

              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-[#141416]">
                <input
                  type="checkbox"
                  checked={inStock}
                  onChange={(e) => updateParam("inStock", e.target.checked ? "true" : null)}
                  className="w-4 h-4 rounded text-[#C59B27] focus:ring-[#C59B27] border-[#E7DFD5]"
                />
                <span>In Stock Only</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-[#141416]">
                <input
                  type="checkbox"
                  checked={onSale}
                  onChange={(e) => updateParam("onSale", e.target.checked ? "true" : null)}
                  className="w-4 h-4 rounded text-[#C59B27] focus:ring-[#C59B27] border-[#E7DFD5]"
                />
                <span>✨ Special Festive Offers (% Off)</span>
              </label>
            </div>

          </div>

          {/* Mobile Apply Button */}
          {mobileOpen && (
            <div className="pt-4 border-t border-[#E7DFD5] shrink-0">
              <button
                onClick={() => setMobileOpen(false)}
                className="w-full py-3 rounded-xl bg-[#141416] text-white text-xs font-bold uppercase tracking-wider shadow-md"
              >
                View Catalog Results
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
