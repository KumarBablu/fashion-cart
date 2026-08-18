"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

const POPULAR_SEARCH_CHIPS = [
  { label: "Silk Sarees", query: "Silk" },
  { label: "Ethnic Kurtis", query: "Kurti" },
  { label: "French Linen Shirts", query: "Linen" },
  { label: "Designer Dresses", query: "Dress" },
  { label: "Men's Denim", query: "Denim" },
  { label: "Velvet Sets", query: "Velvet" },
  { label: "Under ₹1,999", query: "Cotton" },
];

export default function SearchModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => inputRef.current?.focus(), 80);
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
        const res = await fetch(`/api/products?q=${encodeURIComponent(query.trim())}&take=8`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.products || []);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  function handleFullSearch(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (query.trim()) {
      router.push(`/shop?q=${encodeURIComponent(query.trim())}`);
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
      className="fixed inset-0 z-[999999] overflow-y-auto p-4 sm:p-6 md:p-12 flex items-start justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Universal Search & Catalog Discovery"
    >
      {/* Luxury Darkened Backdrop Overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-[#141416]/70 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"
      />

      {/* Main Luxury Search Command Card */}
      <div
        className="relative w-full max-w-3xl rounded-3xl bg-white border border-[#E7DFD5] shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200 mt-4 sm:mt-10"
        style={{ borderColor: "var(--fc-border)" }}
      >
        {/* Top Champagne Gold Luxury Accent Ribbon */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#C59B27] via-[#E0BF48] to-[#141416]" />

        {/* Search Input Bar Section */}
        <form
          onSubmit={handleFullSearch}
          className="relative flex items-center gap-3 px-5 sm:px-6 py-4 border-b border-[#E7DFD5] bg-[#FAF8F5]/60"
        >
          <span className="text-[#C59B27] text-lg shrink-0">
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
            placeholder="Search silk sarees, kurtis, linen shirts, fabrics, colors, sizes..."
            className="flex-1 bg-transparent text-sm sm:text-base font-medium text-[#141416] placeholder:text-[#787C87] outline-none border-none ring-0 shadow-none focus:outline-none focus:ring-0"
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
              className="p-1 rounded-full text-[#787C87] hover:text-[#141416] hover:bg-[#E7DFD5] transition-colors cursor-pointer"
              title="Clear search"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}

          <div className="flex items-center gap-1.5 shrink-0">
            <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono font-bold rounded-lg bg-white border border-[#E7DFD5] text-[#787C87] shadow-2xs">
              ESC
            </kbd>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full border border-[#E7DFD5] bg-white hover:bg-[#FAF8F5] text-[#141416] flex items-center justify-center transition-colors text-xs font-bold cursor-pointer"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>
        </form>

        {/* Quick Trending Suggestions Bar */}
        <div className="px-5 sm:px-6 py-3 border-b border-[#E7DFD5]/70 bg-white flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#787C87] shrink-0 flex items-center gap-1">
            <span>🔥</span> Trending:
          </span>
          <div className="flex items-center gap-1.5">
            {POPULAR_SEARCH_CHIPS.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => handleTagClick(chip.query)}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all shrink-0 cursor-pointer ${
                  query.toLowerCase() === chip.query.toLowerCase()
                    ? "bg-[#141416] text-white"
                    : "bg-[#FAF8F5] text-[#4B4E56] hover:bg-[#F4EFEA] hover:text-[#C59B27] border border-[#E7DFD5]"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Body Results Grid */}
        <div className="max-h-[60vh] overflow-y-auto p-5 sm:p-6 space-y-4">
          {query.trim() === "" ? (
            /* Initial Discovery State */
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#FAF8F5] border border-[#E7DFD5] flex items-center justify-center text-xl mx-auto text-[#C59B27]">
                ✨
              </div>
              <div className="space-y-1">
                <h4 className="font-display font-bold text-sm text-[#141416]">
                  Search anything in our Luxury Atelier Catalog
                </h4>
                <p className="text-xs text-[#787C87] max-w-sm mx-auto leading-relaxed">
                  Type any garment style, pure mulberry silk sarees, breathable French linen shirts, colors, or fabrics.
                </p>
              </div>
            </div>
          ) : loading && results.length === 0 ? (
            /* Loading State */
            <div className="py-16 text-center space-y-3">
              <span className="w-8 h-8 border-2 border-[#C59B27] border-t-transparent rounded-full animate-spin inline-block" />
              <p className="text-xs text-[#787C87] font-medium">Searching fine apparel catalog…</p>
            </div>
          ) : results.length === 0 ? (
            /* Empty Search Results */
            <div className="py-12 text-center space-y-3">
              <div className="text-3xl">🔍</div>
              <div className="space-y-1">
                <h4 className="font-display font-bold text-sm text-[#141416]">
                  No matching garments found for &ldquo;{query}&rdquo;
                </h4>
                <p className="text-xs text-[#787C87] max-w-xs mx-auto leading-relaxed">
                  Try searching by broader terms like <span className="font-bold text-[#141416]">Saree</span>, <span className="font-bold text-[#141416]">Kurti</span>, <span className="font-bold text-[#141416]">Linen</span>, or explore all collections.
                </p>
              </div>
              <Link
                href="/shop"
                onClick={onClose}
                className="inline-block mt-2 px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-[#141416] text-white hover:bg-[#25262B] transition-colors"
              >
                Browse Full Catalog →
              </Link>
            </div>
          ) : (
            /* Populated Search Results Grid */
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-[#787C87] pb-1">
                <span>Matching Apparel ({results.length} results)</span>
                <button
                  onClick={() => handleFullSearch()}
                  className="font-bold text-[#C59B27] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span>View all in store</span>
                  <span>→</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {results.map((product) => {
                  const minPrice = Math.min(...product.variants.map((v) => Number(v.price)));
                  const inStock = product.variants.some((v) => v.stockQuantity > 0);

                  return (
                    <Link
                      key={product.id}
                      href={`/products/${product.slug}`}
                      onClick={onClose}
                      className="group flex gap-3 p-3 rounded-2xl bg-[#FAF8F5]/80 hover:bg-white border border-[#E7DFD5] hover:border-[#C59B27] transition-all duration-200 shadow-2xs hover:shadow-md"
                    >
                      {/* Product Thumbnail */}
                      <div className="relative h-20 w-16 shrink-0 rounded-xl overflow-hidden bg-[#F4EFEA] border border-[#E7DFD5]">
                        {product.images[0] ? (
                          <Image
                            src={product.images[0].imageUrl}
                            alt={product.name}
                            fill
                            sizes="64px"
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-[10px] text-[#787C87]">
                            Garment
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div className="space-y-0.5">
                          <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#C59B27] block truncate">
                            {product.category?.name || "Apparel"}
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
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
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
              <kbd className="font-mono bg-white border border-[#E7DFD5] px-1.5 py-0.5 rounded text-[10px] font-bold">↵</kbd>
              <span>to search all</span>
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:flex items-center gap-1">
              <kbd className="font-mono bg-white border border-[#E7DFD5] px-1.5 py-0.5 rounded text-[10px] font-bold">ESC</kbd>
              <span>to close</span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleFullSearch()}
            className="font-bold text-[#141416] hover:text-[#C59B27] transition-colors cursor-pointer"
          >
            Search Catalog →
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
