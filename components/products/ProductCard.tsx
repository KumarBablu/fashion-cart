"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatINR, discountPercent } from "@/lib/format";
import QuickViewModal from "./QuickViewModal";
import { useToast } from "@/components/providers/ToastProvider";
import { normalizeImageUrl } from "@/lib/utils/imageUrl";
import { ScrollBounceCard } from "@/components/ui/ScrollReveal";

type CardProduct = {
  id?: string;
  slug: string;
  name: string;
  createdAt: string | Date;
  brand?: string | null;
  averageRating?: number | string | null;
  totalReviews?: number | null;
  images: { imageUrl: string; altText?: string | null }[];
  variants: {
    id?: string;
    colour?: string;
    size?: string;
    price: number | string;
    compareAtPrice?: number | string | null;
    stockQuantity: number;
  }[];
};

const DEFAULT_FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80";

export default function ProductCard({ product }: { product: CardProduct }) {
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const { success, error } = useToast();

  const cheapest = [...product.variants].sort((a, b) => Number(a.price) - Number(b.price))[0];
  const price = cheapest ? Number(cheapest.price) : 0;
  const compareAt = cheapest?.compareAtPrice ? Number(cheapest.compareAtPrice) : null;
  const pct = discountPercent(price, compareAt);
  const totalStock = product.variants.reduce((s, v) => s + v.stockQuantity, 0);
  const inStock = totalStock > 0;
  const isLowStock = inStock && totalStock <= 5;

  const isNew = Date.now() - new Date(product.createdAt).getTime() < 1000 * 60 * 60 * 24 * 30;

  const rawPrimary = normalizeImageUrl(product.images[0]?.imageUrl);
  const rawSecondary = normalizeImageUrl(product.images[1]?.imageUrl);
  const primaryImage = rawPrimary || DEFAULT_FALLBACK_IMAGE;
  const secondaryImage = rawSecondary || primaryImage;

  // Extract unique sizes
  const sizes = Array.from(new Set(product.variants.map((v) => v.size).filter(Boolean)));

  async function handleWishlistToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id || product.slug }),
      });

      if (res.status === 401) {
        error("Login Required", "Please login to save items to your wishlist.");
        return;
      }

      if (res.ok) {
        setIsWishlisted(true);
        success("Saved to Wishlist! ❤️", product.name);
        window.dispatchEvent(new CustomEvent("wishlist-updated"));
      }
    } catch {
      error("Error", "Unable to update wishlist.");
    }
  }

  const fullProductForModal = {
    id: product.id || product.slug,
    name: product.name,
    slug: product.slug,
    brand: product.brand,
    images: product.images.length > 0
      ? product.images.map((img, i) => ({ id: String(i), imageUrl: img.imageUrl, altText: img.altText || null }))
      : [{ id: "0", imageUrl: DEFAULT_FALLBACK_IMAGE, altText: product.name }],
    variants: product.variants.map((v, i) => ({
      id: v.id || `${product.slug}-${i}`,
      colour: v.colour || "Standard",
      size: v.size || "Free",
      price: v.price,
      compareAtPrice: v.compareAtPrice || null,
      stockQuantity: v.stockQuantity,
    })),
  };

  const ratingVal = Number(product.averageRating || 4.85).toFixed(1);
  const reviewsCount = product.totalReviews || 48;

  return (
    <>
      <ScrollBounceCard className="w-full h-full">
        <div
          className="group relative flex flex-col rounded-3xl bg-white border border-[#E7DFD5] p-3 transition-all duration-300 hover:border-[#C59B27] hover:shadow-2xl hover:-translate-y-1.5 luxury-card-hover w-full h-full"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Product Image Canvas */}
          <Link
            href={`/products/${product.slug}`}
            prefetch={true}
            className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-[#F4EFEA] block"
          >
            <Image
              src={isHovered && secondaryImage ? secondaryImage : primaryImage}
              alt={product.name}
              fill
              unoptimized
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-108"
            />

            {/* Top Badges */}
            <div className="absolute left-2.5 top-2.5 flex flex-col gap-1 z-10">
              {pct && (
                <span className="rounded-lg px-2.5 py-0.5 text-[10px] font-extrabold uppercase bg-[#C59B27] text-white shadow-sm transition-transform duration-200 group-hover:scale-105">
                  {pct}% OFF
                </span>
              )}
              {isNew && !pct && (
                <span className="rounded-lg px-2.5 py-0.5 text-[10px] font-bold uppercase bg-[#141416] text-white shadow-sm">
                  New
                </span>
              )}
              {!inStock && (
                <span className="rounded-lg bg-[#141416]/90 px-2 py-0.5 text-[9px] font-bold text-white shadow-sm">
                  Sold Out
                </span>
              )}
            </div>

            {/* Wishlist Heart Top Right */}
            <button
              onClick={handleWishlistToggle}
              className={`absolute right-2.5 top-2.5 z-10 h-8 w-8 rounded-full border flex items-center justify-center backdrop-blur-md transition-all shadow-xs cursor-pointer active:scale-90 ${
                isWishlisted
                  ? "bg-rose-50 border-rose-300 text-rose-600 scale-110"
                  : "bg-white/90 border-[#E7DFD5] text-[#787C87] hover:text-rose-600 hover:scale-110"
              }`}
              aria-label="Save to Wishlist"
            >
              {isWishlisted ? "❤️" : "♡"}
            </button>

            {/* Hover Size Strip Overlay */}
            {sizes.length > 0 && (
              <div className="absolute inset-x-2.5 bottom-14 hidden sm:flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-10">
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/95 backdrop-blur-md border border-[#E7DFD5] shadow-md">
                  <span className="text-[9px] font-bold uppercase text-[#787C87] mr-0.5">Sizes:</span>
                  {sizes.slice(0, 5).map((s) => (
                    <span key={s} className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-[#F4EFEA] text-[#141416]">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Quick View Button Hover Overlay */}
            <div className="absolute inset-x-2.5 bottom-2.5 hidden sm:flex opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-3 group-hover:translate-y-0 z-10">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setQuickViewOpen(true);
                }}
                className="w-full py-2 px-3 rounded-xl bg-white/95 backdrop-blur-md border border-[#E7DFD5] hover:bg-[#141416] hover:text-white hover:border-[#141416] text-[#141416] font-bold text-[11px] uppercase tracking-wider shadow-lg transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <span>👁️</span>
                <span>Quick View</span>
              </button>
            </div>
          </Link>

          {/* Product Details Info Area */}
          <div className="mt-3 flex flex-1 flex-col justify-between space-y-2.5 px-1">
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-1 text-[11px] text-[#787C87]">
                <span className="font-semibold uppercase tracking-wider truncate text-[#C59B27]">
                  {product.brand || "Atelier Edition"}
                </span>
                <span className="flex items-center gap-0.5 shrink-0 font-bold text-[#141416]">
                  <span className="text-[#C59B27]">★</span>
                  <span>{ratingVal}</span>
                  <span className="text-[9px] text-[#787C87]">({reviewsCount})</span>
                </span>
              </div>

              <Link href={`/products/${product.slug}`} prefetch={true} className="block group/title">
                <h3 className="font-display text-sm font-bold text-[#141416] group-hover/title:text-[#C59B27] transition-colors line-clamp-2 leading-snug">
                  {product.name}
                </h3>
              </Link>
            </div>

            {/* Pricing Section */}
            <div className="pt-1.5 border-t border-[#E7DFD5]/60 flex flex-wrap items-baseline gap-2">
              <span className="font-mono text-base font-black text-[#141416]">
                {formatINR(price)}
              </span>
              {compareAt && compareAt > price && (
                <span className="font-mono text-xs text-[#787C87] line-through">
                  {formatINR(compareAt)}
                </span>
              )}
              {pct && (
                <span className="text-[11px] font-extrabold text-[#C59B27]">
                  {pct}% off
                </span>
              )}
            </div>

            <div className="flex items-center justify-between text-[10px] text-[#787C87] font-medium">
              <span>Free Delivery</span>
              <span className="text-[#141416] font-semibold">COD Available</span>
            </div>
          </div>
        </div>
      </ScrollBounceCard>

      {/* Quick View Modal */}
      <QuickViewModal
        product={fullProductForModal}
        isOpen={quickViewOpen}
        onClose={() => setQuickViewOpen(false)}
      />
    </>
  );
}
