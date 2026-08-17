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

  const FREE_SHIPPING_THRESHOLD = 499;

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
      // Lock background body scroll
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
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

  const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + Number(i.variant.price) * i.quantity, 0);
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progressPercent = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden" role="dialog" aria-modal="true" aria-label="Shopping Bag">
      {/* Darkened Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-300"
      />

      {/* Slide-Over Luxury Drawer Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-md h-full bg-[#FAF8F5] text-[#141416] shadow-2xl border-l border-[#E7DFD5] flex flex-col animate-in slide-in-from-right duration-300">
          
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-[#E7DFD5] flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative h-8 w-8 shrink-0">
                <Image
                  src="/fashion-cart-logo-transparent.svg"
                  alt="Fashion Cart"
                  fill
                  sizes="32px"
                  className="object-contain"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-lg font-bold text-[#141416] leading-none">
                    Shopping Bag
                  </h2>
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-[#141416] text-white">
                    {totalQuantity}
                  </span>
                </div>
                <p className="text-[10px] text-[#787C87] uppercase tracking-wider font-semibold mt-0.5">
                  The Luxury Atelier
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full border border-[#E7DFD5] hover:bg-[#F4EFEA] text-[#141416] flex items-center justify-center transition-colors text-sm font-bold"
              aria-label="Close cart"
            >
              ✕
            </button>
          </div>

          {/* Free Shipping Progress Indicator */}
          <div className="px-5 py-3 border-b border-[#E7DFD5] bg-[#F4EFEA] shrink-0">
            {remainingForFreeShipping === 0 ? (
              <p className="text-xs font-bold text-[#8E6C0C] flex items-center gap-1.5">
                <span>🎉</span> You unlocked FREE Express Delivery!
              </p>
            ) : (
              <p className="text-xs text-[#4B4E56]">
                Add <strong className="text-[#141416]">{formatINR(remainingForFreeShipping)}</strong> more for <strong className="text-[#C59B27]">FREE Delivery</strong>
              </p>
            )}
            <div className="w-full h-1.5 bg-[#E7DFD5] rounded-full mt-2 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-[#C59B27] to-[#E0BF48]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Scrollable Cart Items Container */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-3.5 divide-y divide-[#E7DFD5]/60">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-xs text-[#787C87] space-y-2">
                <span className="w-6 h-6 border-2 border-[#C59B27] border-t-transparent rounded-full animate-spin" />
                <span>Updating your shopping bag…</span>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="text-5xl">🛍️</div>
                <div className="space-y-1">
                  <h3 className="font-display text-lg font-bold text-[#141416]">Your bag is empty</h3>
                  <p className="text-xs text-[#787C87] max-w-xs mx-auto leading-relaxed">
                    Explore our latest royal silk sarees, velvet kurta sets, and breathable French linen cuts.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#141416] text-white hover:bg-[#25262B] transition-colors shadow-sm"
                >
                  Explore Collection →
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="pt-3.5 first:pt-0 flex gap-3.5 items-start">
                  <div className="relative h-20 w-16 shrink-0 rounded-xl overflow-hidden bg-[#F4EFEA] border border-[#E7DFD5]">
                    {item.product.images[0] ? (
                      <Image
                        src={item.product.images[0].imageUrl}
                        alt={item.product.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-[10px] text-[#787C87]">
                        No image
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex justify-between items-start gap-2">
                      <Link
                        href={`/products/${item.product.slug}`}
                        onClick={onClose}
                        className="text-xs font-bold text-[#141416] hover:text-[#C59B27] transition-colors line-clamp-1"
                      >
                        {item.product.name}
                      </Link>
                      <button
                        onClick={() => remove(item.id)}
                        className="text-xs text-[#787C87] hover:text-rose-600 transition-colors p-1"
                        title="Remove item"
                      >
                        ✕
                      </button>
                    </div>

                    <p className="text-[11px] text-[#787C87]">
                      {item.variant.colour} · Size <span className="font-semibold text-[#141416]">{item.variant.size}</span>
                    </p>

                    <div className="flex items-center justify-between pt-1">
                      {/* Quantity Selector */}
                      <div className="flex items-center border border-[#E7DFD5] rounded-lg bg-white overflow-hidden text-xs">
                        <button
                          onClick={() => updateQty(item.id, Math.max(1, item.quantity - 1))}
                          className="px-2.5 py-1 hover:bg-[#F4EFEA] text-[#141416] font-bold"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="px-2 font-bold text-[#141416]">{item.quantity}</span>
                        <button
                          onClick={() => updateQty(item.id, Math.min(item.variant.stockQuantity, item.quantity + 1))}
                          className="px-2.5 py-1 hover:bg-[#F4EFEA] text-[#141416] font-bold"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      {/* Price */}
                      <span className="text-xs font-black text-[#141416] font-mono">
                        {formatINR(Number(item.variant.price) * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Sticky Luxury Checkout Footer */}
          {items.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-[#E7DFD5] bg-white space-y-3 shrink-0 shadow-lg">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-bold text-[#787C87] uppercase tracking-wider">Subtotal</span>
                <span className="font-mono text-lg font-black text-[#141416]">
                  {formatINR(subtotal)}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#FBF4E2] border border-[#C59B27]/40 text-[11px] text-[#8E6C0C] flex items-center justify-between">
                <span>✨ Use code <strong>FIRST10</strong> for 10% OFF</span>
                <span className="font-mono font-bold uppercase text-[10px]">10% VIP</span>
              </div>

              <div className="space-y-2 pt-1">
                <Link
                  href="/checkout"
                  onClick={onClose}
                  className="w-full py-3 rounded-full font-bold text-xs uppercase tracking-wider text-center block bg-[#141416] text-white hover:bg-[#25262B] transition-colors shadow-md"
                >
                  Proceed to Checkout →
                </Link>
                <Link
                  href="/cart"
                  onClick={onClose}
                  className="w-full py-2.5 rounded-full font-bold text-xs uppercase tracking-wider text-center block border border-[#E7DFD5] text-[#141416] hover:bg-[#F4EFEA] transition-colors"
                >
                  View Full Cart &amp; Apply Coupons
                </Link>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
