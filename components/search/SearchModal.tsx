"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { formatINR } from "@/lib/format";

type SearchResult = {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  category: { name: string; slug: string; parent?: { name: string } | null };
  images: { imageUrl: string }[];
  variants: { price: number | string; stockQuantity: number; colour?: string; size?: string }[];
};

const GARMENTS_CHIPS = [
  { label: "✨ Silk Sarees", query: "Silk" },
  { label: "👗 Ethnic Kurtis", query: "Kurti" },
  { label: "🌿 French Linen", query: "Linen" },
  { label: "👑 Anarkali Gowns", query: "Anarkali" },
  { label: "👖 Men's Denim", query: "Denim" },
  { label: "🏷️ Under ₹1,999", query: "Cotton" },
];

const JEWELLERY_CHIPS = [
  { label: "👑 Bridal Chokers", query: "Choker" },
  { label: "💎 Kundan Sets", query: "Kundan" },
  { label: "✨ 24K Gold Plated", query: "Gold" },
  { label: "💫 Openable Bangles", query: "Bangle" },
  { label: "🌸 Royal Jhumkas", query: "Earring" },
  { label: "💍 Solitaire Rings", query: "Ring" },
];

export default function SearchModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const isJewellery = pathname?.startsWith("/jewellery") || (typeof document !== "undefined" && document.cookie.includes("fc_store=jewellery"));
  const activeStore = isJewellery ? "jewellery" : "garments";
  const chips = isJewellery ? JEWELLERY_CHIPS : GARMENTS_CHIPS;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      document.body.style.overflow = "unset";
      setQuery("");
      setResults([]);
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/products?q=${encodeURIComponent(query.trim())}&take=6&store=${activeStore}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.products || []);
        }
      } catch {
        // ignore network error
      } finally {
        setLoading(false);
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [query, activeStore]);

  function handleFullSearch(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (query.trim()) {
      const targetPath = isJewellery ? `/jewellery?q=${encodeURIComponent(query.trim())}` : `/shop?q=${encodeURIComponent(query.trim())}`;
      router.push(targetPath);
      onClose();
    }
  }

  function handleTagClick(tagQuery: string) {
    setQuery(tagQuery);
    if (inputRef.current) {
      inputRef.current.value = tagQuery;
      inputRef.current.focus();
    }
  }

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[999999] overflow-y-auto p-3 sm:p-6 md:p-10 flex items-start justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Universal Search & Catalog Discovery"
    >
      {/* Luxury Darkened Backdrop Overlay with Silk Blur */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-[#0A0D0C]/80 backdrop-blur-xl transition-opacity duration-300 animate-in fade-in"
      />

      {/* Main Luxury Search Command Card */}
      <div
        className="relative w-full max-w-2xl rounded-3xl bg-[#FAF8F5] border border-[#E7DFD5] shadow-[0_30px_90px_rgba(0,0,0,0.4)] overflow-hidden z-10 animate-in zoom-in-95 duration-200 mt-8 sm:mt-14"
      >
        {/* Top Champagne Gold Luxury Accent Ribbon */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#C59B27] via-[#F3E5AB] to-[#141416]" />

        {/* Encapsulated Search Input Section */}
        <div className="p-4 sm:p-5 pb-3">
          <form
            onSubmit={handleFullSearch}
            className="relative flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-white border border-[#E7DFD5] hover:border-[#D4AF37] focus-within:border-[#C59B27] focus-within:ring-3 focus-within:ring-[#C59B27]/15 focus-within:shadow-[0_4px_24px_rgba(197,155,39,0.18)] transition-all duration-200"
          >
            <span className="text-[#C59B27] text-lg shrink-0 flex items-center justify-center">
              {loading ? (
                <span className="w-5 h-5 border-2 border-[#C59B27] border-t-transparent rounded-full animate-spin inline-block" />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              )}
            </span>

            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                isJewellery
                  ? "Search bridal chokers, bangles, kundan sets, rings..."
                  : "Search pure silk sarees, kurtis, linen shirts, fabrics..."
              }
              className="flex-1 bg-transparent text-sm sm:text-base font-semibold text-[#141416] placeholder:text-[#8E929D] outline-none border-0 ring-0 shadow-none focus:outline-none focus:ring-0 focus:border-0 p-0"
              autoComplete="off"
              spellCheck={false}
            />

            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
                className="p-1 rounded-full text-[#787C87] hover:text-[#141416] hover:bg-[#FAF8F5] transition-all cursor-pointer active:scale-90"
                title="Clear search"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}

            <div className="flex items-center gap-1.5 shrink-0 pl-1 border-l border-[#E7DFD5]">
              <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono font-bold rounded-lg bg-[#FAF8F5] border border-[#E7DFD5] text-[#787C87]">
                ESC
              </kbd>
              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-[#FAF8F5] hover:bg-[#E7DFD5] text-[#141416] flex items-center justify-center transition-colors text-xs font-bold cursor-pointer active:scale-90"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>
          </form>
        </div>

        {/* Quick Trending Suggestions Bar */}
        <div className="px-5 sm:px-6 py-2.5 border-b border-[#E7DFD5]/80 bg-white/70 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#787C87] shrink-0 flex items-center gap-1">
            <span>🔥</span> Popular:
          </span>
          <div className="flex items-center gap-1.5">
            {chips.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => handleTagClick(chip.query)}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all shrink-0 cursor-pointer active:scale-95 ${
                  query.toLowerCase() === chip.query.toLowerCase()
                    ? "bg-[#141416] text-white font-bold shadow-xs scale-105"
                    : "bg-[#FAF8F5] text-[#4B4E56] hover:bg-[#F4EFEA] hover:text-[#C59B27] hover:border-[#D4AF37] border border-[#E7DFD5]"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Body Results Container */}
        <div className="max-h-[52vh] overflow-y-auto p-4 sm:p-5 space-y-3">
          {query.trim() === "" ? (
            /* Initial Discovery State */
            <div className="py-10 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-white border border-[#E7DFD5] flex items-center justify-center text-2xl mx-auto text-[#C59B27] shadow-sm animate-bounce-subtle">
                {isJewellery ? "💍" : "✨"}
              </div>
              <div className="space-y-1">
                <h4 className="font-display font-bold text-base text-[#141416]">
                  {isJewellery
                    ? "Imperial Fine Jewellery & Solitaire Discovery"
                    : "Luxury Atelier & Artisan Garments Discovery"}
                </h4>
                <p className="text-xs text-[#787C87] max-w-sm mx-auto leading-relaxed">
                  {isJewellery
                    ? "Explore handcrafted 24K micro-plated Kundan chokers, temple jhumkas, openable bangles, and solitaire rings."
                    : "Explore pure mulberry silk sarees, breathable French linen shirts, kurtis, and festive bridal ensembles."}
                </p>
              </div>
            </div>
          ) : loading && results.length === 0 ? (
            /* Loading State */
            <div className="py-14 text-center space-y-2.5">
              <span className="w-8 h-8 border-2 border-[#C59B27] border-t-transparent rounded-full animate-spin inline-block" />
              <p className="text-xs text-[#787C87] font-medium">
                {isJewellery ? "Locating jewellery masterpieces…" : "Searching atelier collections…"}
              </p>
            </div>
          ) : results.length === 0 ? (
            /* Empty Search Results */
            <div className="py-10 text-center space-y-2.5">
              <div className="text-3xl">🔍</div>
              <div className="space-y-1">
                <h4 className="font-display font-bold text-sm text-[#141416]">
                  {isJewellery
                    ? `No matching jewellery found for "${query}"`
                    : `No matching garments found for "${query}"`}
                </h4>
                <p className="text-xs text-[#787C87] max-w-xs mx-auto leading-relaxed">
                  {isJewellery
                    ? "Try searching by Choker, Bangle, Kundan, Jhumka, or Ring."
                    : "Try searching by Saree, Kurti, Linen, Denim, or Cotton."}
                </p>
              </div>
              <Link
                href={isJewellery ? "/jewellery" : "/shop"}
                onClick={onClose}
                className="inline-block mt-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#141416] text-white hover:bg-[#25262B] transition-all shadow-sm active:scale-95"
              >
                Browse Full Collection →
              </Link>
            </div>
          ) : (
            /* Populated Search Results Grid */
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs text-[#787C87] px-1">
                <span className="font-semibold">
                  {isJewellery ? "💍 Jewellery Masterpieces" : "👗 Apparel Collections"} ({results.length} found)
                </span>
                <button
                  onClick={() => handleFullSearch()}
                  className="font-bold text-[#C59B27] hover:underline cursor-pointer flex items-center gap-1 active:scale-95"
                >
                  <span>View all in boutique</span>
                  <span>→</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {results.map((product) => {
                  const minPrice = Math.min(...product.variants.map((v) => Number(v.price)));
                  const inStock = product.variants.some((v) => v.stockQuantity > 0);

                  return (
                    <Link
                      key={product.id}
                      href={`/products/${product.slug}`}
                      onClick={onClose}
                      className="group flex gap-3 p-3 rounded-2xl bg-white hover:bg-[#FAF8F5] border border-[#E7DFD5] hover:border-[#C59B27] transition-all duration-200 shadow-2xs hover:shadow-md active:scale-[0.98]"
                    >
                      {/* Product Thumbnail */}
                      <div className="relative h-20 w-16 shrink-0 rounded-xl overflow-hidden bg-[#F4EFEA] border border-[#E7DFD5]">
                        {product.images[0] ? (
                          <Image
                            src={product.images[0].imageUrl}
                            alt={product.name}
                            fill
                            sizes="64px"
                            className="object-cover transition-transform duration-300 group-hover:scale-108"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-[10px] text-[#787C87]">
                            {isJewellery ? "Jewellery" : "Garment"}
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div className="space-y-0.5">
                          <span className="text-[9px] uppercase tracking-wider font-extrabold text-[#C59B27] block truncate">
                            {product.category?.name || (isJewellery ? "Fine Jewellery" : "Apparel")}
                          </span>
                          <h5 className="text-xs font-bold text-[#141416] group-hover:text-[#C59B27] transition-colors line-clamp-1 leading-snug">
                            {product.name}
                          </h5>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span className="font-mono text-xs font-black text-[#141416]">
                            {formatINR(minPrice)}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                              inStock ? "bg-[#E8F5E9] text-[#2E7D32]" : "bg-rose-50 text-rose-600"
                            }`}
                          >
                            {inStock ? "In Stock" : "Sold Out"}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Bar */}
        <div className="px-5 sm:px-6 py-3 border-t border-[#E7DFD5] bg-[#FAF8F5] flex items-center justify-between text-xs text-[#787C87]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="font-mono bg-white border border-[#E7DFD5] px-1.5 py-0.5 rounded text-[10px] font-bold shadow-2xs">↵</kbd>
              <span>to search</span>
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:flex items-center gap-1">
              <kbd className="font-mono bg-white border border-[#E7DFD5] px-1.5 py-0.5 rounded text-[10px] font-bold shadow-2xs">ESC</kbd>
              <span>to close</span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleFullSearch()}
            className="font-bold text-[#141416] hover:text-[#C59B27] transition-colors cursor-pointer active:scale-95"
          >
            {isJewellery ? "Search Full Jewellery Maison →" : "Search Full Catalog →"}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
