"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatINR } from "@/lib/format";
import { useToast } from "@/components/providers/ToastProvider";
import CouponDrawer from "@/components/checkout/CouponDrawer";
import Breadcrumbs from "@/components/ui/Breadcrumbs";

type CartItem = {
  id: string;
  quantity: number;
  product: { name: string; slug: string; images: { imageUrl: string }[] };
  variant: { id: string; colour: string; size: string; price: string | number; stockQuantity: number };
};

export default function CartPage() {
  const [items, setItems] = useState<CartItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loggedOut, setLoggedOut] = useState(false);
  const { success, error: toastError } = useToast();

  // Coupon state
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    description?: string | null;
    discountAmount: number;
  } | null>(null);
  const [validating, setValidating] = useState(false);

  const FREE_SHIPPING_THRESHOLD = 999;

  async function load() {
    const res = await fetch("/api/cart");
    if (res.status === 401) {
      setLoggedOut(true);
      return;
    }
    const data = await res.json();
    setItems(data.cart?.items || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function updateQty(id: string, quantity: number) {
    setError(null);
    const res = await fetch(`/api/cart/items/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }
    load();
    window.dispatchEvent(new CustomEvent("cart-updated"));
  }

  async function remove(id: string) {
    await fetch(`/api/cart/items/${id}`, { method: "DELETE" });
    load();
    window.dispatchEvent(new CustomEvent("cart-updated"));
    success("Item Removed", "Removed item from your cart.");
  }

  const subtotal = items ? items.reduce((sum, i) => sum + Number(i.variant.price) * i.quantity, 0) : 0;
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const deliveryCharge = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : 49;
  const discount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const total = Math.max(0, subtotal - discount + deliveryCharge);

  async function applyCouponByCode(codeToApply: string) {
    if (!codeToApply.trim()) return;
    setValidating(true);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeToApply.trim(), subtotal }),
      });

      const data = await res.json();
      if (res.ok && data.valid) {
        setAppliedCoupon(data.coupon);
        success("Coupon Applied! 🎉", `Saved ${formatINR(data.coupon.discountAmount)} with code ${data.coupon.code}`);
      } else {
        toastError("Coupon Error", data.error || "Could not apply coupon.");
      }
    } catch {
      toastError("Error", "Unable to validate coupon.");
    } finally {
      setValidating(false);
    }
  }

  async function handleApplyCoupon(e: React.FormEvent) {
    e.preventDefault();
    if (!couponInput.trim()) return;
    applyCouponByCode(couponInput);
  }

  if (loggedOut) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <div className="p-8 rounded-3xl border" style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}>
          <h1 className="font-display text-2xl font-bold">Your Shopping Cart</h1>
          <p className="mt-2 text-xs text-dim">Please log in to view saved items in your cart.</p>
          <Link
            href="/login?next=/cart"
            className="mt-6 inline-block rounded-full px-8 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md"
            style={{ backgroundColor: "var(--fc-primary)" }}
          >
            Login to Your Account
          </Link>
        </div>
      </div>
    );
  }

  if (!items) {
    return <div className="mx-auto max-w-4xl px-4 py-24 text-center text-sm text-dim">Loading your cart…</div>;
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <div className="p-8 rounded-3xl border space-y-4" style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}>
          <div className="text-5xl">🛍️</div>
          <h1 className="font-display text-2xl font-bold">Your Bag is Empty</h1>
          <p className="text-xs text-dim max-w-xs mx-auto">
            Discover curated shirts, kurtis, and everyday essentials.
          </p>
          <Link
            href="/shop"
            className="inline-block rounded-full px-8 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md"
            style={{ backgroundColor: "var(--fc-primary)" }}
          >
            Explore Collection →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Shop", href: "/shop" },
          { label: "Shopping Bag" },
        ]}
      />

      <div className="flex items-center justify-between pb-4 border-b border-[#E8E3D8]">
        <div className="flex items-center gap-3">
          <div className="relative h-9 w-9 overflow-hidden">
            <Image
              src="/fashion-cart-logo-transparent.svg"
              alt="Fashion Cart Logo"
              fill
              sizes="36px"
              className="object-contain"
            />
          </div>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0C3B2E]">Shopping Cart</h1>
            <p className="text-xs text-[#5B7A6F] mt-0.5">{items.reduce((s, i) => s + i.quantity, 0)} items in your shopping bag</p>
          </div>
        </div>
        <Link href="/shop" className="text-xs font-bold text-[#0C3B2E] hover:text-[#BB8A52] hover:underline">
          ← Continue Shopping
        </Link>
      </div>

      {/* Free Shipping Meter */}
      <div className="my-6 p-4 rounded-2xl border" style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}>
        {remainingForFreeShipping === 0 ? (
          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <span>🎉</span> Congratulations! You have unlocked FREE Express Delivery.
          </p>
        ) : (
          <p className="text-xs text-dim">
            Add <strong className="text-primary">{formatINR(remainingForFreeShipping)}</strong> more to get <strong>FREE Express Delivery</strong>.
          </p>
        )}
        <div className="w-full h-2 rounded-full overflow-hidden bg-black/10 dark:bg-white/10 mt-2">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100))}%`,
              backgroundColor: remainingForFreeShipping === 0 ? "var(--fc-success)" : "var(--fc-primary)",
            }}
          />
        </div>
      </div>

      {error && <p className="mb-4 text-xs text-rose-500 font-semibold">{error}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
        {/* Cart Items List */}
        <div className="p-6 rounded-2xl border space-y-4" style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}>
          <div className="divide-y" style={{ borderColor: "var(--fc-border)" }}>
            {items.map((item) => (
              <div key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                <div className="relative h-28 w-24 shrink-0 rounded-xl overflow-hidden bg-black/5 border" style={{ borderColor: "var(--fc-border)" }}>
                  {item.product.images[0] ? (
                    <Image src={item.product.images[0].imageUrl} alt={item.product.name} fill className="object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-xs text-dim">No img</div>
                  )}
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <Link href={`/products/${item.product.slug}`} className="font-semibold text-sm hover:text-primary transition-colors">
                        {item.product.name}
                      </Link>
                      <span className="font-bold text-sm">
                        {formatINR(Number(item.variant.price) * item.quantity)}
                      </span>
                    </div>
                    <p className="text-xs text-dim mt-0.5">
                      {item.variant.colour} · Size {item.variant.size}
                    </p>
                    <p className="text-xs text-dim mt-0.5">{formatINR(item.variant.price)} each</p>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center border rounded-lg overflow-hidden text-xs" style={{ borderColor: "var(--fc-border)" }}>
                      <button
                        className="px-2.5 py-1 hover:bg-black/5 dark:hover:bg-white/10 font-bold"
                        onClick={() => updateQty(item.id, Math.max(1, item.quantity - 1))}
                      >
                        −
                      </button>
                      <span className="w-8 text-center font-bold">{item.quantity}</span>
                      <button
                        className="px-2.5 py-1 hover:bg-black/5 dark:hover:bg-white/10 font-bold"
                        onClick={() => updateQty(item.id, Math.min(item.variant.stockQuantity, item.quantity + 1))}
                      >
                        +
                      </button>
                    </div>

                    <button onClick={() => remove(item.id)} className="text-xs text-dim hover:text-rose-500 transition-colors">
                      ✕ Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Summary Sidebar */}
        <div className="space-y-6">
          {/* Coupon Code Section */}
          <div className="p-5 rounded-2xl border space-y-3" style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}>
            <p className="text-xs font-bold uppercase tracking-wider text-dim">Have a Promo Coupon?</p>
            {appliedCoupon ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs">
                <div>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    ✓ {appliedCoupon.code}
                  </p>
                  <p className="text-[11px] text-dim">{appliedCoupon.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAppliedCoupon(null)}
                  className="text-xs text-rose-500 font-bold hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="e.g. FIRST10"
                  className="flex-1 px-3 py-2 rounded-xl border text-xs font-mono font-bold uppercase outline-none focus:border-primary"
                  style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}
                />
                <button
                  type="submit"
                  disabled={validating}
                  className="px-4 py-2 rounded-xl text-xs font-bold uppercase border hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
                  style={{ borderColor: "var(--fc-border)" }}
                >
                  {validating ? "…" : "Apply"}
                </button>
              </form>
            )}

            {/* 1-Click Available Coupons Modal */}
            <CouponDrawer
              subtotal={subtotal}
              onApply={(code) => {
                setCouponInput(code);
                applyCouponByCode(code);
              }}
              appliedCode={appliedCoupon?.code}
            />
          </div>

          {/* Pricing Box */}
          <div className="p-6 rounded-2xl border space-y-4" style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}>
            <h3 className="font-display text-base font-bold">Order Summary</h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-dim">
                <span>Subtotal</span>
                <span>{formatINR(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                  <span>Coupon Discount</span>
                  <span>- {formatINR(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-dim">
                <span>Estimated Delivery</span>
                <span>{deliveryCharge === 0 ? "FREE" : formatINR(deliveryCharge)}</span>
              </div>
              <div className="flex justify-between text-base font-bold pt-3 border-t" style={{ borderColor: "var(--fc-border)" }}>
                <span>Total Amount</span>
                <span className="text-primary text-lg">{formatINR(total)}</span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="block w-full py-3.5 rounded-full font-bold text-center text-xs uppercase tracking-wider text-white shadow-lg transition-all hover:brightness-105"
              style={{ backgroundColor: "var(--fc-primary)" }}
            >
              Proceed to Checkout →
            </Link>

            {/* Trust highlights */}
            <div className="pt-3 border-t grid grid-cols-2 gap-2 text-[11px] text-dim">
              <div className="flex items-center gap-1.5">
                <span>🛡️</span> 100% Genuine
              </div>
              <div className="flex items-center gap-1.5">
                <span>🔄</span> 7-Day Easy Returns
              </div>
              <div className="flex items-center gap-1.5">
                <span>⚡</span> Express Dispatch
              </div>
              <div className="flex items-center gap-1.5">
                <span>🔒</span> Safe Payments
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
