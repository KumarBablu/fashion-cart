"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatINR } from "@/lib/format";
import { useToast } from "@/components/providers/ToastProvider";

type WishlistItem = {
  id: string;
  store: "garments" | "jewellery";
  product: {
    id: string;
    slug: string;
    name: string;
    brand: string | null;
    images: { imageUrl: string }[];
    variants: { id: string; colour: string; size: string; price: string | number; stockQuantity: number }[];
  };
};

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[] | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "garments" | "jewellery">("all");
  const { success, error } = useToast();

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/wishlist");
      if (res.ok) {
        const data = await res.json();
        setItems(data.wishlist?.items || []);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(id: string) {
    await fetch(`/api/wishlist/${id}`, { method: "DELETE" });
    load();
    window.dispatchEvent(new CustomEvent("wishlist-updated"));
    success("Item Removed", "Removed item from wishlist.");
  }

  async function addToCart(variantId: string, wishId: string, itemStore: "garments" | "jewellery") {
    setMovingId(wishId);
    try {
      const res = await fetch(`/api/cart?store=${itemStore}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId, quantity: 1 }),
      });

      if (res.ok) {
        success("Added to Cart! 🛍️", `Item moved to your ${itemStore === "jewellery" ? "Jewellery" : "Garments"} shopping bag.`);
        window.dispatchEvent(new CustomEvent("cart-updated"));
        await remove(wishId);
      } else {
        const data = await res.json();
        error("Error", data.error || "Could not add to cart.");
      }
    } catch {
      error("Network error", "Unable to add item.");
    } finally {
      setMovingId(null);
    }
  }

  if (!items) return <p className="text-sm text-dim py-10 text-center">Loading your saved wishlist…</p>;

  const garmentsCount = items.filter((i) => i.store === "garments").length;
  const jewelleryCount = items.filter((i) => i.store === "jewellery").length;

  const filteredItems = items.filter((i) => {
    if (activeTab === "garments") return i.store === "garments";
    if (activeTab === "jewellery") return i.store === "jewellery";
    return true;
  });

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border p-10 sm:p-14 text-center space-y-5" style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}>
        <div className="w-20 h-20 rounded-3xl bg-[#FAF8F5] border border-[#E7DFD5] flex items-center justify-center text-4xl mx-auto shadow-sm">
          ❤️
        </div>
        <div className="space-y-2">
          <h2 className="font-display text-2xl font-bold text-[#141416]">Your Wishlist is Empty</h2>
          <p className="text-xs text-dim max-w-sm mx-auto leading-relaxed">
            Save bespoke garments, luxury sarees, and 24K fine jewellery you love for later.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/garments"
            className="px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider text-white shadow-md bg-[#141416] hover:bg-[#25262B] transition-all active:scale-95 cursor-pointer"
          >
            Explore Garments →
          </Link>
          <Link
            href="/jewellery"
            className="px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider text-white shadow-md gold-jewellery-btn transition-all active:scale-95 cursor-pointer"
          >
            Explore Fine Jewellery 👑 →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#141416]">My Wishlist</h2>
          <p className="text-xs text-dim mt-0.5">
            {items.length} saved {items.length === 1 ? "item" : "items"} across your boutique collections
          </p>
        </div>

        {/* Store Tabs */}
        <div className="inline-flex rounded-full p-1 border bg-black/5 dark:bg-white/5" style={{ borderColor: "var(--fc-border)" }}>
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === "all"
                ? "bg-white dark:bg-[#1C1D22] text-[#141416] dark:text-white shadow-xs"
                : "text-dim hover:text-foreground"
            }`}
          >
            All ({items.length})
          </button>
          <button
            onClick={() => setActiveTab("garments")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "garments"
                ? "bg-white dark:bg-[#1C1D22] text-[#0C3B2E] shadow-xs"
                : "text-dim hover:text-foreground"
            }`}
          >
            <span>👗</span> Garments ({garmentsCount})
          </button>
          <button
            onClick={() => setActiveTab("jewellery")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "jewellery"
                ? "bg-[#C59B27] text-white shadow-xs"
                : "text-dim hover:text-foreground"
            }`}
          >
            <span>👑</span> Jewellery ({jewelleryCount})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {filteredItems.map((item) => {
          const isJewellery = item.store === "jewellery";
          const inStockVariants = item.product.variants.filter((v) => v.stockQuantity > 0);
          const firstVariant = inStockVariants[0] || item.product.variants[0];
          const hasStock = inStockVariants.length > 0;
          const productStoreUrl = `/products/${item.product.slug}${isJewellery ? "?store=jewellery" : "?store=garments"}`;

          return (
            <div
              key={item.id}
              className={`rounded-2xl border p-3 flex flex-col justify-between transition-all duration-300 card-theme ${
                isJewellery ? "border-[#C59B27]/30 hover:border-[#C59B27]/60" : ""
              }`}
              style={{ backgroundColor: "var(--fc-surface)", borderColor: isJewellery ? undefined : "var(--fc-border)" }}
            >
              <div>
                <Link href={productStoreUrl} className="block relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-black/5">
                  {item.product.images[0] ? (
                    <Image
                      src={item.product.images[0].imageUrl}
                      alt={item.product.name}
                      fill
                      sizes="(max-width: 640px) 50vw, 33vw"
                      className="object-cover hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-xs text-dim">No image</div>
                  )}

                  {/* Store Badge Overlay */}
                  <div className="absolute top-2 left-2 z-10">
                    {isJewellery ? (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-[#141416]/90 text-[#E5C158] border border-[#C59B27]/50 shadow-sm backdrop-blur-xs flex items-center gap-1">
                        <span>👑</span> Jewellery
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-[#141416]/90 text-white border border-white/20 shadow-sm backdrop-blur-xs flex items-center gap-1">
                        <span>👗</span> Garments
                      </span>
                    )}
                  </div>

                  {!hasStock && (
                    <div className="absolute inset-0 bg-black/55 flex items-center justify-center z-20">
                      <span className="text-[10px] font-bold text-white uppercase bg-black/85 px-2.5 py-1 rounded-full border border-white/20">
                        Out of Stock
                      </span>
                    </div>
                  )}
                </Link>

                <div className="mt-3 space-y-1">
                  {item.product.brand && (
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${isJewellery ? "text-[#C59B27]" : "text-primary"}`}>
                      {item.product.brand}
                    </p>
                  )}
                  <Link
                    href={productStoreUrl}
                    className="font-semibold text-xs truncate block hover:text-primary transition-colors leading-snug"
                  >
                    {item.product.name}
                  </Link>
                  {firstVariant && (
                    <p className="font-bold text-sm text-[#141416] dark:text-white">
                      {formatINR(firstVariant.price)}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-3 pt-3 border-t flex flex-col gap-2" style={{ borderColor: "var(--fc-border)" }}>
                {hasStock && firstVariant ? (
                  <button
                    disabled={movingId === item.id}
                    onClick={() => addToCart(firstVariant.id, item.id, item.store)}
                    className={`w-full py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-white shadow-xs hover:brightness-105 transition-all disabled:opacity-50 active:scale-95 cursor-pointer ${
                      isJewellery ? "gold-jewellery-btn" : "bg-[#141416] hover:bg-[#25262B]"
                    }`}
                  >
                    {movingId === item.id ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Moving…
                      </span>
                    ) : (
                      "Move to Cart →"
                    )}
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full py-2 rounded-xl text-xs font-semibold border opacity-50 cursor-not-allowed"
                    style={{ borderColor: "var(--fc-border)" }}
                  >
                    Out of Stock
                  </button>
                )}

                <button
                  onClick={() => remove(item.id)}
                  className="text-[11px] text-dim hover:text-rose-500 transition-colors text-center cursor-pointer py-1"
                >
                  ✕ Remove from Wishlist
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
