"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatINR } from "@/lib/format";
import { useToast } from "@/components/providers/ToastProvider";

type CartItem = {
  id: string;
  quantity: number;
  product: { name: string; slug: string; images: { imageUrl: string }[] };
  variant: { id: string; colour: string; size: string; price: string | number; stockQuantity: number };
};

export default function CartDrawer({
  isOpen,
  onClose,
  onCartChange,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCartChange?: () => void;
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { error } = useToast();

  const FREE_SHIPPING_THRESHOLD = 999;

  async function loadCart() {
    setLoading(true);
    try {
      const res = await fetch("/api/cart");
      if (res.ok) {
        const data = await res.json();
        setItems(data?.cart?.items || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadCart();
    }
  }, [isOpen]);

  async function updateQty(id: string, quantity: number) {
    const res = await fetch(`/api/cart/items/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity }),
    });
    const data = await res.json();
    if (!res.ok) {
      error("Quantity Update", data.error || "Could not update quantity");
      return;
    }
    loadCart();
    if (onCartChange) onCartChange();
  }

  async function remove(id: string) {
    await fetch(`/api/cart/items/${id}`, { method: "DELETE" });
    loadCart();
    if (onCartChange) onCartChange();
  }

  if (!isOpen) return null;

  const subtotal = items.reduce((sum, i) => sum + Number(i.variant.price) * i.quantity, 0);
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progressPercent = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div
          className="w-screen max-w-md flex flex-col shadow-2xl border-l animate-in slide-in-from-right duration-300"
          style={{
            backgroundColor: "var(--fc-surface)",
            borderColor: "var(--fc-border)",
            color: "var(--fc-text)",
          }}
        >
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-[#E8E3D8] flex items-center justify-between bg-white">
            <div className="flex items-center gap-2.5">
              <div className="relative h-7 w-7 overflow-hidden">
                <Image
                  src="/fashion-cart-logo-transparent.svg"
                  alt="Fashion Cart Logo"
                  fill
                  sizes="28px"
                  className="object-contain"
                />
              </div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-lg sm:text-xl font-bold text-[#0C3B2E]">Shopping Bag</h2>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-[#F2EFE8] text-[#0C3B2E]">
                  {items.reduce((sum, i) => sum + i.quantity, 0)}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-[#F2EFE8] text-[#0C3B2E] transition-colors text-base"
              aria-label="Close cart"
            >
              ✕
            </button>
          </div>

          {/* Free Shipping Progress Meter */}
          <div className="px-4 sm:px-6 py-3 border-b" style={{ backgroundColor: "var(--fc-bg-subtle)", borderColor: "var(--fc-border)" }}>
            {remainingForFreeShipping === 0 ? (
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <span>🎉</span> You unlocked FREE Delivery!
              </p>
            ) : (
              <p className="text-xs text-muted">
                Add <span className="font-bold text-primary">{formatINR(remainingForFreeShipping)}</span> more for <span className="font-semibold">FREE Delivery</span>
              </p>
            )}
            <div className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progressPercent}%`,
                  backgroundColor: remainingForFreeShipping === 0 ? "var(--fc-success)" : "var(--fc-primary)",
                }}
              />
            </div>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-20 text-sm text-dim">
                Loading your cart…
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-3">🛍️</div>
                <h3 className="font-display text-lg font-semibold">Your cart is empty</h3>
                <p className="text-xs text-dim mt-1 max-w-xs mx-auto">
                  Looks like you haven&apos;t added any fashion items to your bag yet.
                </p>
                <button
                  onClick={onClose}
                  className="mt-6 px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider"
                  style={{
                    backgroundColor: "var(--fc-primary)",
                    color: "var(--fc-primary-fg)",
                  }}
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3.5 p-3 rounded-xl border transition-all"
                  style={{
                    backgroundColor: "var(--fc-bg)",
                    borderColor: "var(--fc-border)",
                  }}
                >
                  <div className="relative h-20 w-16 shrink-0 rounded-lg overflow-hidden bg-black/5">
                    {item.product.images[0] ? (
                      <Image
                        src={item.product.images[0].imageUrl}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-[10px] text-dim">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <Link
                        href={`/products/${item.product.slug}`}
                        onClick={onClose}
                        className="text-sm font-semibold truncate hover:underline"
                      >
                        {item.product.name}
                      </Link>
                      <button
                        onClick={() => remove(item.id)}
                        className="text-xs text-dim hover:text-red-500 transition-colors ml-2"
                        title="Remove item"
                      >
                        ✕
                      </button>
                    </div>
                    <p className="text-xs text-dim mt-0.5">
                      {item.variant.colour} · Size {item.variant.size}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border rounded-lg overflow-hidden text-xs" style={{ borderColor: "var(--fc-border)" }}>
                        <button
                          onClick={() => updateQty(item.id, Math.max(1, item.quantity - 1))}
                          className="px-2.5 py-1 hover:bg-black/5 dark:hover:bg-white/10"
                        >
                          −
                        </button>
                        <span className="px-2 font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQty(item.id, Math.min(item.variant.stockQuantity, item.quantity + 1))}
                          className="px-2.5 py-1 hover:bg-black/5 dark:hover:bg-white/10"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-sm font-bold">
                        {formatINR(Number(item.variant.price) * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout CTA */}
          {items.length > 0 && (
            <div className="p-4 sm:p-6 border-t space-y-4" style={{ borderColor: "var(--fc-border)", backgroundColor: "var(--fc-surface)" }}>
              <div className="flex justify-between text-sm">
                <span className="text-dim">Subtotal</span>
                <span className="font-bold text-base">{formatINR(subtotal)}</span>
              </div>
              <p className="text-[11px] text-dim">
                Taxes and shipping calculated during checkout. Use coupon code <span className="font-semibold text-primary">FIRST10</span> for extra discount.
              </p>
              <div className="flex flex-col gap-2">
                <Link
                  href="/checkout"
                  onClick={onClose}
                  className="w-full py-3.5 rounded-full font-bold text-center text-sm uppercase tracking-wider transition-all shadow-md hover:brightness-105"
                  style={{
                    backgroundColor: "var(--fc-primary)",
                    color: "var(--fc-primary-fg)",
                  }}
                >
                  Proceed to Checkout →
                </Link>
                <Link
                  href="/cart"
                  onClick={onClose}
                  className="w-full py-2.5 rounded-full text-xs font-semibold text-center border hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  style={{ borderColor: "var(--fc-border)" }}
                >
                  View Full Cart & Apply Coupons
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
