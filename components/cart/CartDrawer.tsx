"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
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
  isLoggedIn = false,
  onCartChange,
}: {
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn?: boolean;
  onCartChange?: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [store, setStore] = useState<"garments" | "jewellery">("garments");
  const { error, success } = useToast();

  const FREE_SHIPPING_THRESHOLD = 999;

  useEffect(() => {
    setMounted(true);
  }, []);

  function getActiveStore(): "garments" | "jewellery" {
    if (typeof window === "undefined") return "garments";
    const path = window.location.pathname;
    if (path.startsWith("/jewellery")) return "jewellery";
    if (path.startsWith("/garments")) return "garments";
    const match = document.cookie.match(/(?:^|;\s*)fc_store=([^;]+)/);
    if (match && match[1] === "jewellery") return "jewellery";
    const saved = sessionStorage.getItem("fc_active_store");
    if (saved === "jewellery") return "jewellery";
    return "garments";
  }

  async function loadCart() {
    if (!isLoggedIn) {
      setItems([]);
      return;
    }
    setLoading(true);
    const active = getActiveStore();
    setStore(active);
    try {
      const res = await fetch(`/api/cart?store=${active}`);
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
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, isLoggedIn]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  async function updateQty(id: string, quantity: number) {
    setUpdatingId(id);
    try {
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
      await loadCart();
      if (onCartChange) onCartChange();
      window.dispatchEvent(new Event("cart-updated"));
    } finally {
      setUpdatingId(null);
    }
  }

  async function remove(id: string) {
    setUpdatingId(id);
    try {
      await fetch(`/api/cart/items/${id}`, { method: "DELETE" });
      await loadCart();
      if (onCartChange) onCartChange();
      window.dispatchEvent(new Event("cart-updated"));
      success("Item Removed", "Your shopping bag has been updated.");
    } finally {
      setUpdatingId(null);
    }
  }

  if (!mounted) return null;

  const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + Number(i.variant.price) * i.quantity, 0);
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progressPercent = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));

  const drawerContent = (
    <div
      className={`fixed inset-0 z-[999999] overflow-hidden transition-all duration-300 ${
        isOpen ? "visible pointer-events-auto" : "invisible pointer-events-none"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Shopping Bag & Cart Review"
    >
      {/* Premium Backdrop Overlay with Smooth Fade */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-[#141416]/70 backdrop-blur-md transition-opacity duration-300 ease-out cursor-pointer ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Slide-in Full-Height Luxury Drawer Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-4 sm:pl-10">
        <aside
          className={`w-screen max-w-md h-full bg-[#FAF8F5] text-[#141416] shadow-2xl border-l border-[#C59B27]/40 flex flex-col justify-between transform transition-transform duration-350 ease-out ${
            isOpen ? "translate-x-0" : "translate-x-full"
          }`}
          style={{
            boxShadow: "-8px 0 36px rgba(20, 20, 22, 0.28), -2px 0 14px rgba(197, 155, 39, 0.2)",
            transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {/* 1. Header Section */}
          <div className="p-4 sm:p-5 border-b border-[#E7DFD5] bg-white flex items-center justify-between shrink-0 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="relative h-9 w-9 shrink-0">
                <Image
                  src="/fashion-cart-logo-transparent.svg"
                  alt="Fashion Cart Luxury Monogram"
                  fill
                  sizes="36px"
                  className="object-contain"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-lg font-black text-[#141416] tracking-tight leading-none">
                    Shopping Bag
                  </h2>
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-[#141416] text-[#FFFFFF] font-mono">
                    {totalQuantity} {totalQuantity === 1 ? "item" : "items"}
                  </span>
                </div>
                <p className="text-[10px] text-[#C59B27] uppercase tracking-[0.2em] font-bold mt-0.5">
                  Fashion Cart Premium Outlet
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full border border-[#E7DFD5] bg-[#FAF8F5] hover:bg-[#E7DFD5] text-[#141416] flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-90"
              aria-label="Close cart review"
              title="Close (Esc)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* 2. Free Express Delivery Progress Ribbon */}
          <div className="px-5 py-3 border-b border-[#E7DFD5] bg-[#F4EFEA]/80 shrink-0">
            <div className="flex items-center justify-between text-xs mb-1.5">
              {remainingForFreeShipping === 0 ? (
                <span className="font-bold text-[#2E7D32] flex items-center gap-1.5">
                  <span>✨</span> Free Express Delivery Unlocked!
                </span>
              ) : (
                <span className="text-[#4B4E56] font-medium">
                  Add <strong className="text-[#141416] font-bold">{formatINR(remainingForFreeShipping)}</strong> more for <strong className="text-[#C59B27] font-bold">FREE Express Delivery</strong>
                </span>
              )}
              <span className="text-[10px] font-mono font-bold text-[#787C87]">{progressPercent}%</span>
            </div>
            <div className="w-full h-2 bg-[#E7DFD5] rounded-full overflow-hidden p-0.5">
              <div
                className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-[#C59B27] via-[#E0BF48] to-[#2E7D32]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* 3. Main Scrollable Items List */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4">
            {!isLoggedIn ? (
              <div className="text-center py-12 px-3 space-y-6 animate-luxury-up">
                {/* Luxury Icon with Gold Halo */}
                <div className="relative w-18 h-18 rounded-3xl bg-gradient-to-tr from-[#141416] via-[#2A2B30] to-[#141416] border border-[#C59B27]/50 flex items-center justify-center mx-auto shadow-xl">
                  <span className="text-3xl">🔒</span>
                  <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#C59B27] text-white text-xs font-bold shadow-sm">
                    ✦
                  </span>
                </div>

                {/* Title & Description */}
                <div className="space-y-2">
                  <span className="inline-block px-3 py-1 rounded-full bg-[#FBF4E2] border border-[#C59B27]/40 text-[10px] font-extrabold uppercase tracking-widest text-[#8E6C0C]">
                    Atelier Member Access
                  </span>
                  <h3 className="font-display text-2xl font-bold text-[#141416] tracking-tight">
                    Sign In to View Shopping Bag
                  </h3>
                  <p className="text-xs text-[#787C87] max-w-xs mx-auto leading-relaxed">
                    Please log in to your account to review your selected garments, fine jewellery, and checkout securely.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2.5 pt-1 max-w-xs mx-auto">
                  <Link
                    href={`/login?next=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname + window.location.search : "/cart")}`}
                    onClick={onClose}
                    className="w-full py-3.5 rounded-full font-bold text-xs uppercase tracking-wider text-center block text-white bg-[#141416] hover:bg-[#25262B] transition-all shadow-lg active:scale-95 cursor-pointer luxury-card-hover"
                    style={{
                      border: "1px solid rgba(197, 155, 39, 0.4)",
                    }}
                  >
                    Sign In to Your Account →
                  </Link>
                  <Link
                    href="/register"
                    onClick={onClose}
                    className="w-full py-2.5 rounded-full font-bold text-xs uppercase tracking-wider text-center block border border-[#E7DFD5] bg-white text-[#141416] hover:bg-[#FAF8F5] transition-all shadow-xs active:scale-95 cursor-pointer"
                  >
                    Create New Account
                  </Link>
                </div>

                {/* Perks Checklist */}
                <div className="pt-4 border-t border-[#E7DFD5] text-left space-y-2 text-[11px] text-[#4B4E56] max-w-xs mx-auto">
                  <p className="font-bold uppercase text-[10px] tracking-wider text-center mb-2 text-[#C59B27]">
                    ✦ Member Privileges
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-[#C59B27] font-bold">✓</span>
                    <span>Persistent cart synced across all devices</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#C59B27] font-bold">✓</span>
                    <span>Instant 1-click VIP coupon codes & discounts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#C59B27] font-bold">✓</span>
                    <span>Real-time tracking & WhatsApp order concierge</span>
                  </div>
                </div>
              </div>
            ) : loading && items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-xs text-[#787C87] space-y-3">
                <span className="w-8 h-8 border-2 border-[#C59B27] border-t-transparent rounded-full animate-spin" />
                <span className="font-medium">Loading your shopping bag…</span>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-20 px-4 space-y-5">
                <div className="w-16 h-16 rounded-full bg-[#F4EFEA] border border-[#E7DFD5] flex items-center justify-center text-2xl mx-auto shadow-xs">
                  🛍️
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-display text-xl font-bold text-[#141416]">Your shopping bag is empty</h3>
                  <p className="text-xs text-[#787C87] max-w-xs mx-auto leading-relaxed">
                    Discover handcrafted mulberry silk sarees, bespoke linen shirts, and royal velvet apparel curated for distinction.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider bg-[#141416] text-white hover:bg-[#25262B] transition-all shadow-md cursor-pointer active:scale-95"
                >
                  Explore Signature Collection →
                </button>
              </div>
            ) : (
              <div className="space-y-3.5 divide-y divide-[#E7DFD5]/70">
                {items.map((item, idx) => {
                  const isBusy = updatingId === item.id;
                  const itemPrice = Number(item.variant.price);
                  const itemTotal = itemPrice * item.quantity;

                  return (
                    <div
                      key={item.id}
                      className={`pt-3.5 first:pt-0 flex gap-3.5 items-start transition-all duration-300 animate-luxury-up ${
                        isBusy ? "opacity-50 pointer-events-none" : "opacity-100"
                      }`}
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      {/* Product Thumbnail */}
                      <Link
                        href={`/products/${item.product.slug}`}
                        onClick={onClose}
                        className="relative h-24 w-20 shrink-0 rounded-2xl overflow-hidden bg-[#F4EFEA] border border-[#E7DFD5] group shadow-2xs block"
                      >
                        {item.product.images[0] ? (
                          <Image
                            src={item.product.images[0].imageUrl}
                            alt={item.product.name}
                            fill
                            sizes="80px"
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-[10px] text-[#787C87]">
                            Garment
                          </div>
                        )}
                      </Link>

                      {/* Product & Variant Details */}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex justify-between items-start gap-2">
                          <Link
                            href={`/products/${item.product.slug}`}
                            onClick={onClose}
                            className="text-xs font-bold text-[#141416] hover:text-[#C59B27] transition-colors line-clamp-2 leading-snug"
                          >
                            {item.product.name}
                          </Link>
                          <button
                            onClick={() => remove(item.id)}
                            className="text-[#787C87] hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition-colors cursor-pointer active:scale-90"
                            title="Remove from bag"
                            aria-label="Remove item"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>

                        {/* Variant Badges */}
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                          <span className="px-2 py-0.5 rounded-md bg-[#F4EFEA] border border-[#E7DFD5] font-semibold text-[#4B4E56]">
                            {item.variant.colour}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-[#F4EFEA] border border-[#E7DFD5] font-bold text-[#141416]">
                            Size: {item.variant.size}
                          </span>
                        </div>

                        {/* Quantity Controls & Price Display */}
                        <div className="flex items-center justify-between pt-1.5">
                          {/* Quantity Selector Pill */}
                          <div className="inline-flex items-center border border-[#E7DFD5] rounded-xl bg-white shadow-2xs overflow-hidden">
                            <button
                              onClick={() => updateQty(item.id, Math.max(1, item.quantity - 1))}
                              className="px-2.5 py-1 text-xs font-bold text-[#141416] hover:bg-[#F4EFEA] transition-colors cursor-pointer active:scale-90"
                              aria-label="Decrease quantity"
                              disabled={item.quantity <= 1}
                            >
                              −
                            </button>
                            <span className="px-2.5 text-xs font-bold font-mono text-[#141416]">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQty(item.id, Math.min(item.variant.stockQuantity || 99, item.quantity + 1))}
                              className="px-2.5 py-1 text-xs font-bold text-[#141416] hover:bg-[#F4EFEA] transition-colors cursor-pointer active:scale-90"
                              aria-label="Increase quantity"
                              disabled={item.quantity >= (item.variant.stockQuantity || 99)}
                            >
                              +
                            </button>
                          </div>

                          {/* Line Total */}
                          <div className="text-right">
                            <span className="text-xs font-black text-[#141416] font-mono block">
                              {formatINR(itemTotal)}
                            </span>
                            {item.quantity > 1 && (
                              <span className="text-[10px] text-[#787C87] font-mono">
                                ({formatINR(itemPrice)} each)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. Luxury Sticky Summary & Checkout Footer */}
          {items.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-[#E7DFD5] bg-white space-y-3 shrink-0 shadow-lg">
              
              {/* Price Breakdown */}
              <div className="space-y-1.5 text-xs border-b border-[#E7DFD5] pb-3">
                <div className="flex justify-between items-center text-[#787C87]">
                  <span>Subtotal ({totalQuantity} {totalQuantity === 1 ? "item" : "items"})</span>
                  <span className="font-mono font-bold text-[#141416]">{formatINR(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-[#787C87]">
                  <span>Estimated Delivery</span>
                  <span className="font-bold text-[#2E7D32]">
                    {remainingForFreeShipping === 0 ? "FREE" : formatINR(99)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline pt-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#141416]">
                    Total Payable
                  </span>
                  <span className="font-mono text-lg font-black text-[#141416]">
                    {formatINR(subtotal + (remainingForFreeShipping === 0 ? 0 : 99))}
                  </span>
                </div>
              </div>

              {/* Promo Coupon Privilege Banner */}
              <div className="p-2.5 rounded-xl bg-[#FBF4E2] border border-[#C59B27]/40 text-[11px] text-[#8E6C0C] flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span>🏷️</span>
                  <span>Use coupon <strong>FIRST10</strong> for 10% OFF</span>
                </div>
                <span className="font-mono font-bold uppercase text-[10px] bg-[#C59B27]/15 px-1.5 py-0.5 rounded">
                  VIP PRIVILEGE
                </span>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <Link
                  href={`/checkout${store === "jewellery" ? "?store=jewellery" : ""}`}
                  onClick={onClose}
                  className={`w-full py-3.5 rounded-full font-bold text-xs uppercase tracking-wider text-center block text-white hover:brightness-105 transition-all shadow-md cursor-pointer active:scale-95 luxury-card-hover ${
                    store === "jewellery"
                      ? "gold-jewellery-btn"
                      : "bg-[#141416] hover:bg-[#25262B]"
                  }`}
                >
                  Proceed to Secure Checkout →
                </Link>
                <Link
                  href={`/cart${store === "jewellery" ? "?store=jewellery" : ""}`}
                  onClick={onClose}
                  className="w-full py-2.5 rounded-full font-bold text-xs uppercase tracking-wider text-center block border border-[#E7DFD5] bg-[#FAF8F5] text-[#141416] hover:bg-[#E7DFD5] transition-all cursor-pointer active:scale-95"
                >
                  View Full Cart &amp; Apply Coupons
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="pt-2 flex items-center justify-center gap-4 text-[10px] text-[#787C87] border-t border-[#E7DFD5]/60 font-medium">
                <span className="flex items-center gap-1">✨ 100% Authentic</span>
                <span>•</span>
                <span className="flex items-center gap-1">🔄 7-Day Returns</span>
              </div>
            </div>
          )}

        </aside>
      </div>
    </div>
  );

  return createPortal(drawerContent, document.body);
}
