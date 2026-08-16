"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatINR } from "@/lib/format";
import { useToast } from "@/components/providers/ToastProvider";

type WishlistItem = {
  id: string;
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
  const { success, error } = useToast();

  async function load() {
    try {
      const res = await fetch("/api/wishlist");
      if (res.ok) {
        const data = await res.json();
        setItems(data.wishlist?.items || []);
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id: string) {
    await fetch(`/api/wishlist/${id}`, { method: "DELETE" });
    load();
    window.dispatchEvent(new CustomEvent("wishlist-updated"));
    success("Item Removed", "Removed item from wishlist.");
  }

  async function addToCart(variantId: string, wishId: string) {
    setMovingId(wishId);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId, quantity: 1 }),
      });

      if (res.ok) {
        success("Added to Cart! 🛍️", "Item moved to your cart.");
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

  if (!items) return <p className="text-sm text-dim py-10 text-center">Loading your wishlist…</p>;

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border p-12 text-center space-y-4" style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}>
        <div className="text-5xl">❤️</div>
        <h2 className="font-display text-xl font-bold">Your Wishlist is Empty</h2>
        <p className="text-xs text-dim max-w-sm mx-auto">
          Save styles you love for later and track seasonal discounts.
        </p>
        <Link
          href="/shop"
          className="inline-block px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider text-white shadow-md"
          style={{ backgroundColor: "var(--fc-primary)" }}
        >
          Explore Collection →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold">My Wishlist</h2>
          <p className="text-xs text-dim mt-0.5">{items.length} saved items</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {items.map((item) => {
          const inStockVariants = item.product.variants.filter((v) => v.stockQuantity > 0);
          const firstVariant = inStockVariants[0] || item.product.variants[0];
          const hasStock = inStockVariants.length > 0;

          return (
            <div
              key={item.id}
              className="rounded-2xl border p-3 flex flex-col justify-between card-theme"
              style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}
            >
              <div>
                <Link href={`/products/${item.product.slug}`} className="block relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-black/5">
                  {item.product.images[0] ? (
                    <Image src={item.product.images[0].imageUrl} alt={item.product.name} fill className="object-cover hover:scale-105 transition-transform" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-xs text-dim">No image</div>
                  )}
                  {!hasStock && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-white uppercase bg-black/80 px-2 py-0.5 rounded">
                        Out of Stock
                      </span>
                    </div>
                  )}
                </Link>

                <div className="mt-3">
                  {item.product.brand && (
                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
                      {item.product.brand}
                    </p>
                  )}
                  <Link href={`/products/${item.product.slug}`} className="font-semibold text-xs truncate block hover:text-primary transition-colors">
                    {item.product.name}
                  </Link>
                  {firstVariant && (
                    <p className="font-bold text-sm mt-1">{formatINR(firstVariant.price)}</p>
                  )}
                </div>
              </div>

              <div className="mt-3 pt-3 border-t flex flex-col gap-2" style={{ borderColor: "var(--fc-border)" }}>
                {hasStock && firstVariant ? (
                  <button
                    disabled={movingId === item.id}
                    onClick={() => addToCart(firstVariant.id, item.id)}
                    className="w-full py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-white shadow-xs hover:brightness-105 transition-all disabled:opacity-50"
                    style={{ backgroundColor: "var(--fc-primary)" }}
                  >
                    {movingId === item.id ? "Moving…" : "Move to Cart →"}
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full py-2 rounded-xl text-xs font-semibold border opacity-50"
                    style={{ borderColor: "var(--fc-border)" }}
                  >
                    Out of Stock
                  </button>
                )}

                <button
                  onClick={() => remove(item.id)}
                  className="text-[11px] text-dim hover:text-rose-500 transition-colors text-center"
                >
                  ✕ Remove
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
