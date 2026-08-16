"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatINR } from "@/lib/format";

type SearchResult = {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  category: { name: string; slug: string };
  images: { imageUrl: string }[];
  variants: { price: number | string; stockQuantity: number }[];
};

export default function SearchModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults([]);
    }
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
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/products?q=${encodeURIComponent(query.trim())}&take=6`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.products || []);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  function handleFullSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/shop?q=${encodeURIComponent(query.trim())}`);
      onClose();
    }
  }

  if (!isOpen) return null;

  const popularTags = ["Formal Shirts", "Rayon Kurti", "Denim Jeans", "Summer Dresses", "Casual Tops"];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20 animate-in fade-in duration-200">
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
      />

      <div
        className="relative mx-auto max-w-2xl rounded-2xl shadow-2xl border overflow-hidden animate-in zoom-in-95 duration-200"
        style={{
          backgroundColor: "var(--fc-surface)",
          borderColor: "var(--fc-border)",
          color: "var(--fc-text)",
        }}
      >
        {/* Search Bar Input */}
        <form onSubmit={handleFullSearch} className="flex items-center px-4 py-3.5 border-b border-[#E8E3D8] bg-white">
          <div className="relative h-6 w-6 shrink-0 mr-2.5 overflow-hidden">
            <Image
              src="/fashion-cart-logo-transparent.svg"
              alt="FC Logo"
              fill
              sizes="24px"
              className="object-contain"
            />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search shirts, kurtis, dresses, fabrics, brands…"
            className="flex-1 bg-transparent text-sm sm:text-base outline-none font-medium placeholder:text-[#5B7A6F] text-[#0C3B2E]"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-xs px-2 py-1 rounded bg-black/5 dark:bg-white/10 opacity-70 hover:opacity-100"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="ml-3 text-xs px-2.5 py-1 rounded-md border text-dim hover:bg-black/5 dark:hover:bg-white/5"
            style={{ borderColor: "var(--fc-border)" }}
          >
            ESC
          </button>
        </form>

        {/* Popular Tags */}
        {!query && (
          <div className="p-5">
            <p className="text-xs font-bold uppercase tracking-wider opacity-60 mb-3">Trending Searches</p>
            <div className="flex flex-wrap gap-2">
              {popularTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    setQuery(tag);
                  }}
                  className="text-xs px-3 py-1.5 rounded-full border transition-colors hover:border-primary"
                  style={{
                    backgroundColor: "var(--fc-bg)",
                    borderColor: "var(--fc-border)",
                  }}
                >
                  🔥 {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Live Search Results */}
        {query && (
          <div className="p-4 max-h-96 overflow-y-auto divide-y" style={{ borderColor: "var(--fc-border)" }}>
            {loading ? (
              <div className="py-10 text-center text-sm text-dim">Searching catalog…</div>
            ) : results.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm font-medium">No fashion items found for &quot;{query}&quot;</p>
                <p className="text-xs text-dim mt-1">Try searching for cotton shirts, jeans, or kurtis.</p>
              </div>
            ) : (
              results.map((product) => {
                const cheapest = [...product.variants].sort((a, b) => Number(a.price) - Number(b.price))[0];
                return (
                  <Link
                    key={product.id}
                    href={`/products/${product.slug}`}
                    onClick={onClose}
                    className="flex items-center gap-3.5 py-2.5 px-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
                  >
                    <div className="relative h-14 w-12 rounded-lg overflow-hidden shrink-0 bg-black/5">
                      {product.images[0] ? (
                        <Image
                          src={product.images[0].imageUrl}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-[10px] text-dim">
                          No img
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                        {product.name}
                      </p>
                      <p className="text-xs text-dim mt-0.5">
                        {product.brand ? `${product.brand} · ` : ""}{product.category?.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">
                        {cheapest ? formatINR(cheapest.price) : "-"}
                      </p>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                        In Stock
                      </span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        )}

        {/* View All Footer */}
        {query && results.length > 0 && (
          <div className="p-3 bg-black/5 dark:bg-white/5 border-t text-center" style={{ borderColor: "var(--fc-border)" }}>
            <button
              onClick={handleFullSearch}
              className="text-xs font-bold uppercase tracking-wider text-primary hover:underline"
            >
              View all results for &quot;{query}&quot; →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
