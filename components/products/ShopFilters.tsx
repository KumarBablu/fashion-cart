"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";
import { formatINR } from "@/lib/format";

type Category = { id: string; name: string; slug: string; parentId: string | null };

const GARMENT_COLOR_SWATCHES: { label: string; query: string; bg: string; border?: string }[] = [
  { label: "Noir Black", query: "Black", bg: "#141416" },
  { label: "Silk Ivory", query: "White", bg: "#FAF8F5", border: "#D1D5DB" },
  { label: "Navy Blue", query: "Blue", bg: "#1E3A8A" },
  { label: "Royal Maroon", query: "Maroon", bg: "#881337" },
  { label: "Crimson Red", query: "Red", bg: "#DC2626" },
  { label: "Emerald Green", query: "Green", bg: "#047857" },
  { label: "Champagne Gold", query: "Gold", bg: "#C59B27" },
  { label: "Rose Pink", query: "Rose", bg: "#E11D48" },
  { label: "Beige Sand", query: "Beige", bg: "#D4C5B9" },
  { label: "Plum Purple", query: "Plum", bg: "#6B21A8" },
  { label: "Teal Green", query: "Teal", bg: "#0D9488" },
  { label: "Multicolour", query: "Multi", bg: "linear-gradient(135deg, #EF4444, #F59E0B, #10B981, #3B82F6)" },
];

const JEWELLERY_COLOR_SWATCHES: { label: string; query: string; bg: string; border?: string }[] = [
  { label: "24K Micro Gold", query: "Gold", bg: "#D4AF37" },
  { label: "Antique Matte", query: "Antique Gold", bg: "#B8860B" },
  { label: "Silver / Rhodium", query: "Silver", bg: "#E5E7EB", border: "#9CA3AF" },
  { label: "Rose Gold", query: "Rose Gold", bg: "#E0A899" },
  { label: "Kundan Pearl", query: "White", bg: "#FAF8F5", border: "#D1D5DB" },
  { label: "Ruby Red", query: "Ruby", bg: "#9F1239" },
  { label: "Emerald Green", query: "Emerald", bg: "#065F46" },
  { label: "Meenakari Multi", query: "Multi", bg: "linear-gradient(135deg, #EF4444, #F59E0B, #10B981, #3B82F6)" },
  { label: "Black Oxidised", query: "Black", bg: "#1F2937" },
];

const STANDARD_GARMENT_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "Free Size"];
const WAIST_SIZES = ["28", "30", "32", "34", "36", "38"];
const KIDS_SIZES = ["2-3 Y", "3-4 Y", "4-5 Y", "5-6 Y", "6-7 Y", "7-8 Y", "8-9 Y", "9-10 Y"];

const BANGLE_SIZES = ["2.4 (Small)", "2.6 (Medium)", "2.8 (Large)", "Openable / Free Size"];
const RING_SIZES = ["Adjustable Band", "Size 12", "Size 14", "Size 16", "Size 18", "Size 20"];
const NECKLACE_SIZES = ["One Size", "Adjustable Dori"];

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

  // Accordion toggle states
  const [openSections, setOpenSections] = useState({
    categories: true,
    colours: true,
    sizes: true,
    price: true,
    offers: true,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

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
      {/* Mobile Filter Trigger Button */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setMobileOpen(true)}
          className="w-full py-3.5 px-5 rounded-2xl bg-white border border-[#E7DFD5] shadow-xs flex items-center justify-between text-xs font-bold text-[#141416] transition-all active:scale-[0.98]"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-base">🎛️</span>
            <span>Refine &amp; Filter Products</span>
            {hasActiveFilters && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#C59B27] text-white">
                Active
              </span>
            )}
          </div>
          <span className="text-[#C59B27] font-semibold text-xs flex items-center gap-1">
            <span>Configure</span>
            <span>→</span>
          </span>
        </button>
      </div>

      {/* Main Filter Panel Wrapper */}
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
              ? "w-full max-w-md h-full bg-[#FAF8F5] p-6 overflow-y-auto shadow-2xl flex flex-col justify-between"
              : "space-y-4"
          }`}
        >
          {/* Mobile Header */}
          {mobileOpen && (
            <div className="flex items-center justify-between pb-4 border-b border-[#E7DFD5] shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">{isJewellery ? "💍" : "👗"}</span>
                <div>
                  <h3 className="font-display text-base font-bold text-[#141416]">
                    {isJewellery ? "Imperial Jewellery Filters" : "Atelier Garments Filters"}
                  </h3>
                  <p className="text-[11px] text-[#787C87]">Refine catalog by craft, tone &amp; sizes</p>
                </div>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="w-8 h-8 rounded-full border border-[#E7DFD5] hover:bg-[#F4EFEA] flex items-center justify-center font-bold text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          <div className="space-y-4 flex-1">
            {/* Active Filters Pill Strip */}
            {hasActiveFilters && (
              <div className="p-4 rounded-2xl bg-white border border-[#C59B27]/40 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-[#141416]">
                  <span className="flex items-center gap-1.5 text-[#8E6C0C]">
                    <span>✦</span>
                    <span className="uppercase tracking-wider">Active Refinements</span>
                  </span>
                  <button
                    onClick={clearAllFilters}
                    className="text-[#C59B27] hover:text-[#141416] text-[11px] font-bold hover:underline cursor-pointer"
                  >
                    Reset All
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {activeCategoryObj && (
                    <button
                      onClick={() => updateParam("category", null)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-[#FAF8F5] text-[#141416] border border-[#E7DFD5] shadow-2xs hover:border-[#C59B27] transition-all cursor-pointer"
                    >
                      <span>{activeCategoryObj.name}</span>
                      <span className="text-rose-500 font-bold">×</span>
                    </button>
                  )}
                  {activeColour && (
                    <button
                      onClick={() => updateParam("colour", null)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-[#FAF8F5] text-[#141416] border border-[#E7DFD5] shadow-2xs hover:border-[#C59B27] transition-all cursor-pointer"
                    >
                      <span>Tone: {activeColour}</span>
                      <span className="text-rose-500 font-bold">×</span>
                    </button>
                  )}
                  {activeSize && (
                    <button
                      onClick={() => updateParam("size", null)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-[#FAF8F5] text-[#141416] border border-[#E7DFD5] shadow-2xs hover:border-[#C59B27] transition-all cursor-pointer"
                    >
                      <span>Size: {activeSize}</span>
                      <span className="text-rose-500 font-bold">×</span>
                    </button>
                  )}
                  {(activeMinPrice || activeMaxPrice) && (
                    <button
                      onClick={() => updatePriceTier(null, null)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-[#FAF8F5] text-[#141416] border border-[#E7DFD5] shadow-2xs hover:border-[#C59B27] transition-all cursor-pointer"
                    >
                      <span>
                        {activeMinPrice ? formatINR(Number(activeMinPrice)) : "₹0"} –{" "}
                        {activeMaxPrice ? formatINR(Number(activeMaxPrice)) : "Above"}
                      </span>
                      <span className="text-rose-500 font-bold">×</span>
                    </button>
                  )}
                  {onSale && (
                    <button
                      onClick={() => updateParam("onSale", null)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#FBF4E2] text-[#8E6C0C] border border-[#C59B27]/50 shadow-2xs cursor-pointer"
                    >
                      <span>✨ On Sale</span>
                      <span className="text-rose-500 font-bold">×</span>
                    </button>
                  )}
                  {inStock && (
                    <button
                      onClick={() => updateParam("inStock", null)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs cursor-pointer"
                    >
                      <span>In Stock</span>
                      <span className="text-rose-500 font-bold">×</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* UNIFIED LUXURY FILTER CARD */}
            <div className="rounded-3xl border border-[#E7DFD5] bg-white/95 backdrop-blur-md shadow-xs overflow-hidden divide-y divide-[#E7DFD5]/60">
              
              {/* 🏷️ SECTION 1: DEPARTMENT & CATEGORIES */}
              <div className="p-4 sm:p-5 space-y-3">
                <div
                  onClick={() => toggleSection("categories")}
                  className="flex items-center justify-between cursor-pointer select-none group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{isJewellery ? "👑" : "🥻"}</span>
                    <h4 className="font-display text-xs font-bold uppercase tracking-wider text-[#141416] group-hover:text-[#C59B27] transition-colors">
                      {isJewellery ? "Collections & Categories" : "Departments & Silhouettes"}
                    </h4>
                  </div>
                  <span className="text-xs text-[#787C87] group-hover:text-[#141416] transition-transform">
                    {openSections.categories ? "▴" : "▾"}
                  </span>
                </div>

                {openSections.categories && (
                  <div className="pt-2 space-y-1.5 animate-in fade-in duration-200">
                    <button
                      onClick={() => updateParam("category", null)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                        !activeCategory
                          ? "bg-[#141416] text-white shadow-xs"
                          : "text-[#4B4E56] hover:text-[#141416] hover:bg-[#FAF8F5]"
                      }`}
                    >
                      <span>{isJewellery ? "✦ All Jewellery Pieces" : "✦ All Apparel & Kurtis"}</span>
                      {!activeCategory && <span className="text-xs">✓</span>}
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
                              className={`flex-1 text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                                isCatActive
                                  ? "bg-[#C59B27] text-white shadow-xs font-extrabold"
                                  : "text-[#141416] hover:bg-[#FAF8F5]"
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
                                className="p-2 text-xs text-[#787C87] hover:text-[#141416] transition-colors cursor-pointer"
                                aria-label="Toggle subcategories"
                              >
                                {isExpanded ? "▾" : "▸"}
                              </button>
                            )}
                          </div>

                          {/* Subcategories */}
                          {children.length > 0 && isExpanded && (
                            <div className="pl-4 space-y-1 border-l border-[#E7DFD5] ml-4 py-1">
                              {children.map((sub) => {
                                const isSubActive = activeCategory === sub.slug;
                                return (
                                  <button
                                    key={sub.id}
                                    onClick={() => updateParam("category", isSubActive ? null : sub.slug)}
                                    className={`w-full text-left px-3 py-1.5 rounded-lg text-[11px] transition-all flex items-center justify-between cursor-pointer ${
                                      isSubActive
                                        ? "bg-[#141416] text-white font-bold"
                                        : "text-[#787C87] hover:text-[#141416] hover:bg-[#FAF8F5]"
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
                )}
              </div>

              {/* 🎨 SECTION 2: COLOUR PALETTE & POLISH */}
              <div className="p-4 sm:p-5 space-y-3">
                <div
                  onClick={() => toggleSection("colours")}
                  className="flex items-center justify-between cursor-pointer select-none group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{isJewellery ? "✨" : "🎨"}</span>
                    <h4 className="font-display text-xs font-bold uppercase tracking-wider text-[#141416] group-hover:text-[#C59B27] transition-colors">
                      {isJewellery ? "Plating & Gem Tone" : "Atelier Colour Palette"}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    {activeColour && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateParam("colour", null);
                        }}
                        className="text-[10px] text-[#C59B27] hover:underline font-semibold"
                      >
                        Reset
                      </button>
                    )}
                    <span className="text-xs text-[#787C87] group-hover:text-[#141416] transition-transform">
                      {openSections.colours ? "▴" : "▾"}
                    </span>
                  </div>
                </div>

                {openSections.colours && (
                  <div className="pt-2 grid grid-cols-2 gap-2 animate-in fade-in duration-200">
                    {colorSwatches.map((swatch) => {
                      const isSelected = activeColour === swatch.query;
                      return (
                        <button
                          key={swatch.label}
                          onClick={() => updateParam("colour", isSelected ? null : swatch.query)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left border cursor-pointer ${
                            isSelected
                              ? "bg-[#141416] text-white border-[#141416] font-bold shadow-xs"
                              : "bg-[#FAF8F5]/60 text-[#141416] border-[#E7DFD5] hover:bg-white hover:border-[#C59B27]"
                          }`}
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
                            style={{
                              background: swatch.bg,
                              border: swatch.border ? `1px solid ${swatch.border}` : "1px solid rgba(0,0,0,0.15)",
                            }}
                          />
                          <span className="truncate text-[11px]">{swatch.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 📏 SECTION 3: SIZES & FITS */}
              <div className="p-4 sm:p-5 space-y-3">
                <div
                  onClick={() => toggleSection("sizes")}
                  className="flex items-center justify-between cursor-pointer select-none group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{isJewellery ? "💍" : "📏"}</span>
                    <h4 className="font-display text-xs font-bold uppercase tracking-wider text-[#141416] group-hover:text-[#C59B27] transition-colors">
                      {isJewellery ? "Jewellery Size & Fit" : "Garment Proportions & Size"}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    {activeSize && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateParam("size", null);
                        }}
                        className="text-[10px] text-[#C59B27] hover:underline font-semibold"
                      >
                        Reset
                      </button>
                    )}
                    <span className="text-xs text-[#787C87] group-hover:text-[#141416] transition-transform">
                      {openSections.sizes ? "▴" : "▾"}
                    </span>
                  </div>
                </div>

                {openSections.sizes && (
                  <div className="pt-2 space-y-2.5 animate-in fade-in duration-200">
                    {isJewellery ? (
                      <>
                        <div className="flex items-center p-1 rounded-xl bg-[#FAF8F5] border border-[#E7DFD5] text-[10px] font-bold">
                          <button
                            onClick={() => setJewellerySizeTab("bangles")}
                            className={`flex-1 py-1.5 text-center rounded-lg transition-all cursor-pointer ${
                              jewellerySizeTab === "bangles"
                                ? "bg-[#141416] text-white shadow-xs font-bold"
                                : "text-[#787C87] hover:text-[#141416]"
                            }`}
                          >
                            Bangles
                          </button>
                          <button
                            onClick={() => setJewellerySizeTab("rings")}
                            className={`flex-1 py-1.5 text-center rounded-lg transition-all cursor-pointer ${
                              jewellerySizeTab === "rings"
                                ? "bg-[#141416] text-white shadow-xs font-bold"
                                : "text-[#787C87] hover:text-[#141416]"
                            }`}
                          >
                            Rings
                          </button>
                          <button
                            onClick={() => setJewellerySizeTab("all")}
                            className={`flex-1 py-1.5 text-center rounded-lg transition-all cursor-pointer ${
                              jewellerySizeTab === "all"
                                ? "bg-[#141416] text-white shadow-xs font-bold"
                                : "text-[#787C87] hover:text-[#141416]"
                            }`}
                          >
                            Necklaces
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-1">
                          {(jewellerySizeTab === "bangles"
                            ? BANGLE_SIZES
                            : jewellerySizeTab === "rings"
                            ? RING_SIZES
                            : NECKLACE_SIZES
                          ).map((sz) => {
                            const queryVal = sz.split(" ")[0];
                            const isSelected = activeSize === queryVal || activeSize === sz;
                            return (
                              <button
                                key={sz}
                                onClick={() => updateParam("size", isSelected ? null : queryVal)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                                  isSelected
                                    ? "bg-[#C59B27] text-white border-[#C59B27] shadow-xs"
                                    : "bg-[#FAF8F5]/60 text-[#141416] border-[#E7DFD5] hover:bg-white hover:border-[#C59B27]"
                                }`}
                              >
                                {sz}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center p-1 rounded-xl bg-[#FAF8F5] border border-[#E7DFD5] text-[10px] font-bold">
                          <button
                            onClick={() => setGarmentSizeTab("standard")}
                            className={`flex-1 py-1.5 text-center rounded-lg transition-all cursor-pointer ${
                              garmentSizeTab === "standard"
                                ? "bg-[#141416] text-white shadow-xs font-bold"
                                : "text-[#787C87] hover:text-[#141416]"
                            }`}
                          >
                            Standard
                          </button>
                          <button
                            onClick={() => setGarmentSizeTab("waist")}
                            className={`flex-1 py-1.5 text-center rounded-lg transition-all cursor-pointer ${
                              garmentSizeTab === "waist"
                                ? "bg-[#141416] text-white shadow-xs font-bold"
                                : "text-[#787C87] hover:text-[#141416]"
                            }`}
                          >
                            Waist
                          </button>
                          <button
                            onClick={() => setGarmentSizeTab("kids")}
                            className={`flex-1 py-1.5 text-center rounded-lg transition-all cursor-pointer ${
                              garmentSizeTab === "kids"
                                ? "bg-[#141416] text-white shadow-xs font-bold"
                                : "text-[#787C87] hover:text-[#141416]"
                            }`}
                          >
                            Kids
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-1">
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
                                className={`min-w-9 h-8 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center cursor-pointer ${
                                  isSelected
                                    ? "bg-[#141416] text-white border-[#141416] shadow-xs"
                                    : "bg-[#FAF8F5]/60 text-[#141416] border-[#E7DFD5] hover:bg-white hover:border-[#C59B27]"
                                }`}
                              >
                                {sz}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* 💰 SECTION 4: PRICE RANGE */}
              <div className="p-4 sm:p-5 space-y-3">
                <div
                  onClick={() => toggleSection("price")}
                  className="flex items-center justify-between cursor-pointer select-none group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">💎</span>
                    <h4 className="font-display text-xs font-bold uppercase tracking-wider text-[#141416] group-hover:text-[#C59B27] transition-colors">
                      Price Range
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    {(activeMinPrice || activeMaxPrice) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updatePriceTier(null, null);
                        }}
                        className="text-[10px] text-[#C59B27] hover:underline font-semibold"
                      >
                        Reset
                      </button>
                    )}
                    <span className="text-xs text-[#787C87] group-hover:text-[#141416] transition-transform">
                      {openSections.price ? "▴" : "▾"}
                    </span>
                  </div>
                </div>

                {openSections.price && (
                  <div className="pt-2 space-y-3 animate-in fade-in duration-200">
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
                            onClick={() =>
                              updatePriceTier(isSelected ? null : tier.min, isSelected ? null : tier.max)
                            }
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between border cursor-pointer ${
                              isSelected
                                ? "bg-[#141416] text-white border-[#141416] font-bold shadow-xs"
                                : "bg-[#FAF8F5]/60 text-[#4B4E56] border-[#E7DFD5] hover:bg-white hover:border-[#C59B27]"
                            }`}
                          >
                            <span>{tier.label}</span>
                            {isSelected && <span className="text-xs">✓</span>}
                          </button>
                        );
                      })}
                    </div>

                    {/* Min/Max Inputs */}
                    <form onSubmit={applyCustomPrice} className="pt-2 border-t border-[#E7DFD5]/60 space-y-2.5">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-[#787C87] block mb-1">MIN (₹)</label>
                          <input
                            type="number"
                            placeholder="0"
                            value={customMin}
                            onChange={(e) => setCustomMin(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-[#E7DFD5] text-xs text-[#141416] bg-[#FAF8F5]/60 focus:bg-white focus:outline-none focus:border-[#C59B27]"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-[#787C87] block mb-1">MAX (₹)</label>
                          <input
                            type="number"
                            placeholder="10000"
                            value={customMax}
                            onChange={(e) => setCustomMax(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-[#E7DFD5] text-xs text-[#141416] bg-[#FAF8F5]/60 focus:bg-white focus:outline-none focus:border-[#C59B27]"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-xl bg-[#141416] hover:bg-[#25262B] text-white text-[11px] font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer"
                      >
                        Apply Price
                      </button>
                    </form>
                  </div>
                )}
              </div>

              {/* ✨ SECTION 5: AVAILABILITY & PRIVILEGE OFFERS */}
              <div className="p-4 sm:p-5 space-y-3">
                <div
                  onClick={() => toggleSection("offers")}
                  className="flex items-center justify-between cursor-pointer select-none group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">✨</span>
                    <h4 className="font-display text-xs font-bold uppercase tracking-wider text-[#141416] group-hover:text-[#C59B27] transition-colors">
                      Privilege Offers &amp; Stock
                    </h4>
                  </div>
                  <span className="text-xs text-[#787C87] group-hover:text-[#141416] transition-transform">
                    {openSections.offers ? "▴" : "▾"}
                  </span>
                </div>

                {openSections.offers && (
                  <div className="pt-2 space-y-2.5 animate-in fade-in duration-200">
                    <label className="flex items-center gap-3 p-2.5 rounded-xl border border-[#E7DFD5] bg-[#FAF8F5]/60 hover:bg-white cursor-pointer transition-all">
                      <input
                        type="checkbox"
                        checked={inStock}
                        onChange={(e) => updateParam("inStock", e.target.checked ? "true" : null)}
                        className="w-4 h-4 rounded text-[#C59B27] focus:ring-[#C59B27] border-[#E7DFD5] cursor-pointer"
                      />
                      <div className="text-xs font-semibold text-[#141416]">
                        <span>In Stock Ready to Dispatch</span>
                        <p className="text-[10px] text-[#787C87]">Immediate 24hr doorstep fulfillment</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-2.5 rounded-xl border border-[#C59B27]/40 bg-[#FBF4E2]/60 hover:bg-[#FBF4E2] cursor-pointer transition-all">
                      <input
                        type="checkbox"
                        checked={onSale}
                        onChange={(e) => updateParam("onSale", e.target.checked ? "true" : null)}
                        className="w-4 h-4 rounded text-[#8E6C0C] focus:ring-[#8E6C0C] border-[#C59B27] cursor-pointer"
                      />
                      <div className="text-xs font-bold text-[#8E6C0C]">
                        <span>✨ Special Festive Offers (% Off)</span>
                        <p className="text-[10px] text-[#8E6C0C]/80">Curated promotional discounts</p>
                      </div>
                    </label>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Mobile Apply Button */}
          {mobileOpen && (
            <div className="pt-4 border-t border-[#E7DFD5] shrink-0 mt-4">
              <button
                onClick={() => setMobileOpen(false)}
                className="w-full py-3.5 rounded-2xl bg-[#141416] text-white text-xs font-bold uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>View Filtered Results</span>
                <span>→</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
