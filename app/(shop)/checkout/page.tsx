"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { formatINR } from "@/lib/format";
import { useToast } from "@/components/providers/ToastProvider";

type Address = {
  id: string;
  fullName: string;
  mobileNumber: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  pinCode: string;
  landmark?: string | null;
  isDefault: boolean;
};

type CartItem = {
  id: string;
  quantity: number;
  product: { name: string; slug: string };
  variant: { colour: string; size: string; price: string | number };
};

const emptyForm = {
  fullName: "",
  mobileNumber: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  pinCode: "",
  landmark: "",
};

export default function CheckoutPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [items, setItems] = useState<CartItem[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Coupon state
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    id: string;
    code: string;
    description?: string | null;
    discountAmount: number;
  } | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState<"MANUAL_UPI" | "COD" | "ONLINE_GATEWAY">("MANUAL_UPI");
  const [customerNotes, setCustomerNotes] = useState("");

  async function loadAll() {
    try {
      const [addrRes, cartRes] = await Promise.all([fetch("/api/addresses"), fetch("/api/cart")]);
      if (addrRes.status === 401) {
        router.push("/login?next=/checkout");
        return;
      }
      const addrData = await addrRes.json();
      const cartData = await cartRes.json();
      setAddresses(addrData.addresses || []);
      setItems(cartData.cart?.items || []);

      const def = addrData.addresses?.find((a: Address) => a.isDefault) ?? addrData.addresses?.[0];
      if (def) setSelectedAddress(def.id);
      else setShowForm(true);
    } catch {
      setError("Unable to load checkout details.");
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function saveAddress(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setForm(emptyForm);
    setShowForm(false);
    setSelectedAddress(data.address.id);
    loadAll();
  }

  const subtotal = items.reduce((sum, i) => sum + Number(i.variant.price) * i.quantity, 0);
  const deliveryCharge = subtotal >= 999 || subtotal === 0 ? 0 : 49;
  const discount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const total = Math.max(0, subtotal - discount + deliveryCharge);

  async function handleApplyCoupon(e: React.FormEvent) {
    e.preventDefault();
    if (!couponInput.trim()) return;

    setValidatingCoupon(true);
    setError(null);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponInput.trim(), subtotal }),
      });

      const data = await res.json();
      if (res.ok && data.valid) {
        setAppliedCoupon(data.coupon);
        success("Coupon Applied! 🎉", `Saved ${formatINR(data.coupon.discountAmount)} with code ${data.coupon.code}`);
      } else {
        toastError("Invalid Coupon", data.error || "Coupon could not be applied.");
      }
    } catch {
      toastError("Error", "Could not validate coupon.");
    } finally {
      setValidatingCoupon(false);
    }
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null);
    setCouponInput("");
  }

  async function placeOrder() {
    if (!selectedAddress) {
      setError("Please select a delivery address.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addressId: selectedAddress,
          couponCode: appliedCoupon?.code || undefined,
          paymentMethod,
          customerNotes: customerNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not place order.");
        setSubmitting(false);
        return;
      }

      window.dispatchEvent(new CustomEvent("cart-updated"));

      if (paymentMethod === "MANUAL_UPI") {
        router.push(`/checkout/${data.order.id}/payment`);
      } else {
        success(
          paymentMethod === "COD" ? "Order Confirmed! 🚚" : "Payment Verified! 🎉",
          `Order #${data.order.orderNumber} placed successfully.`
        );
        router.push(`/account/orders/${data.order.id}`);
      }
    } catch {
      setError("Network error while placing order.");
      setSubmitting(false);
    }
  }

  if (!addresses) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-24 text-center text-sm text-dim">
        Preparing secure checkout…
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-bold">Your cart is empty</h1>
        <p className="text-xs text-dim mt-2">Add items to your cart before proceeding to checkout.</p>
        <button
          onClick={() => router.push("/shop")}
          className="mt-6 px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider text-white"
          style={{ backgroundColor: "var(--fc-primary)" }}
        >
          Browse Shop →
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
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
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0C3B2E]">Secure Checkout</h1>
            <p className="text-[11px] text-[#BB8A52] font-semibold">Official Fashion Cart Storefront</p>
          </div>
        </div>
        <span className="text-xs text-[#0C3B2E] font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#E8E3D8] shadow-xs">
          <span>🔒</span> 256-bit SSL Encrypted
        </span>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
        {/* Left Column: Address & Payment */}
        <div className="space-y-8">
          {/* 1. Address Selection */}
          <section
            className="p-6 rounded-2xl border space-y-4"
            style={{
              backgroundColor: "var(--fc-surface)",
              borderColor: "var(--fc-border)",
            }}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">1. Select Delivery Address</h2>
              {!showForm && (
                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  + Add New Address
                </button>
              )}
            </div>

            <div className="space-y-3">
              {addresses.map((a) => (
                <label
                  key={a.id}
                  className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedAddress === a.id ? "border-primary shadow-xs" : "opacity-80 hover:opacity-100"
                  }`}
                  style={{
                    backgroundColor: selectedAddress === a.id ? "var(--fc-bg-subtle)" : "var(--fc-bg)",
                    borderColor: selectedAddress === a.id ? "var(--fc-primary)" : "var(--fc-border)",
                  }}
                >
                  <input
                    type="radio"
                    name="address"
                    checked={selectedAddress === a.id}
                    onChange={() => setSelectedAddress(a.id)}
                    className="mt-1"
                  />
                  <div className="text-xs space-y-0.5">
                    <p className="font-bold text-sm">{a.fullName} · {a.mobileNumber}</p>
                    <p className="text-dim">
                      {a.addressLine1}{a.addressLine2 ? `, ${a.addressLine2}` : ""}, {a.city}, {a.state} - {a.pinCode}
                    </p>
                    {a.landmark && <p className="text-[11px] text-dim">Landmark: {a.landmark}</p>}
                  </div>
                </label>
              ))}
            </div>

            {showForm && (
              <form onSubmit={saveAddress} className="mt-4 p-4 rounded-xl border grid grid-cols-1 sm:grid-cols-2 gap-3" style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}>
                <Input label="Full name *" value={form.fullName} onChange={(v) => setForm({ ...form, fullName: v })} required />
                <Input label="Mobile number *" value={form.mobileNumber} onChange={(v) => setForm({ ...form, mobileNumber: v })} required />
                <Input label="Address line 1 *" value={form.addressLine1} onChange={(v) => setForm({ ...form, addressLine1: v })} required className="sm:col-span-2" />
                <Input label="Address line 2" value={form.addressLine2} onChange={(v) => setForm({ ...form, addressLine2: v })} className="sm:col-span-2" />
                <Input label="City *" value={form.city} onChange={(v) => setForm({ ...form, city: v })} required />
                <Input label="State *" value={form.state} onChange={(v) => setForm({ ...form, state: v })} required />
                <Input label="PIN code *" value={form.pinCode} onChange={(v) => setForm({ ...form, pinCode: v })} required />
                <Input label="Landmark" value={form.landmark} onChange={(v) => setForm({ ...form, landmark: v })} />
                <div className="sm:col-span-2 flex gap-3 pt-2">
                  <button type="submit" className="px-5 py-2 rounded-full text-xs font-bold uppercase text-white" style={{ backgroundColor: "var(--fc-primary)" }}>
                    Save Address
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-full border text-xs text-dim" style={{ borderColor: "var(--fc-border)" }}>
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </section>

          {/* 2. Payment Method Selector */}
          <section
            className="p-6 rounded-2xl border space-y-4"
            style={{
              backgroundColor: "var(--fc-surface)",
              borderColor: "var(--fc-border)",
            }}
          >
            <h2 className="font-display text-lg font-bold">2. Choose Payment Method</h2>

            <div className="space-y-3">
              {/* Option 1: Manual UPI QR */}
              <label
                className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                  paymentMethod === "MANUAL_UPI" ? "border-primary shadow-xs" : "opacity-80 hover:opacity-100"
                }`}
                style={{
                  backgroundColor: paymentMethod === "MANUAL_UPI" ? "var(--fc-bg-subtle)" : "var(--fc-bg)",
                  borderColor: paymentMethod === "MANUAL_UPI" ? "var(--fc-primary)" : "var(--fc-border)",
                }}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="MANUAL_UPI"
                  checked={paymentMethod === "MANUAL_UPI"}
                  onChange={() => setPaymentMethod("MANUAL_UPI")}
                  className="mt-1"
                />
                <div>
                  <p className="font-bold text-sm">📱 Scan & Pay via UPI QR (GPay / PhonePe / Paytm / BHIM)</p>
                  <p className="text-xs text-dim mt-0.5">
                    Scan our verified QR code, make the payment, and submit your UTR number for admin verification.
                  </p>
                </div>
              </label>

              {/* Option 2: Cash on Delivery */}
              <label
                className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                  paymentMethod === "COD" ? "border-primary shadow-xs" : "opacity-80 hover:opacity-100"
                }`}
                style={{
                  backgroundColor: paymentMethod === "COD" ? "var(--fc-bg-subtle)" : "var(--fc-bg)",
                  borderColor: paymentMethod === "COD" ? "var(--fc-primary)" : "var(--fc-border)",
                }}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="COD"
                  checked={paymentMethod === "COD"}
                  onChange={() => setPaymentMethod("COD")}
                  className="mt-1"
                />
                <div>
                  <p className="font-bold text-sm">💵 Cash on Delivery (COD)</p>
                  <p className="text-xs text-dim mt-0.5">
                    Pay in cash when your order arrives at your doorstep. Order confirms immediately.
                  </p>
                </div>
              </label>

              {/* Option 3: Instant Online Gateway Simulation */}
              <label
                className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                  paymentMethod === "ONLINE_GATEWAY" ? "border-primary shadow-xs" : "opacity-80 hover:opacity-100"
                }`}
                style={{
                  backgroundColor: paymentMethod === "ONLINE_GATEWAY" ? "var(--fc-bg-subtle)" : "var(--fc-bg)",
                  borderColor: paymentMethod === "ONLINE_GATEWAY" ? "var(--fc-primary)" : "var(--fc-border)",
                }}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="ONLINE_GATEWAY"
                  checked={paymentMethod === "ONLINE_GATEWAY"}
                  onChange={() => setPaymentMethod("ONLINE_GATEWAY")}
                  className="mt-1"
                />
                <div>
                  <p className="font-bold text-sm">💳 Instant Online Payment (Card / NetBanking / UPI)</p>
                  <p className="text-xs text-dim mt-0.5">
                    Fast instant verification mode. Order confirms immediately and invoice generates instantly.
                  </p>
                </div>
              </label>
            </div>

            {/* Customer Notes */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-dim uppercase mb-1">
                Order Notes / Delivery Instructions (Optional)
              </label>
              <textarea
                rows={2}
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                placeholder="e.g. Please call before delivery or leave with security."
                className="w-full px-3.5 py-2 rounded-xl border text-xs outline-none focus:border-primary"
                style={{
                  backgroundColor: "var(--fc-bg)",
                  borderColor: "var(--fc-border)",
                }}
              />
            </div>
          </section>
        </div>

        {/* Right Column: Order Summary & Coupon */}
        <div className="space-y-6">
          {/* Coupon Box */}
          <div
            className="p-5 rounded-2xl border space-y-3"
            style={{
              backgroundColor: "var(--fc-surface)",
              borderColor: "var(--fc-border)",
            }}
          >
            <p className="text-xs font-bold uppercase tracking-wider text-dim">🏷️ Apply Promo Coupon</p>

            {appliedCoupon ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs">
                <div>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    ✓ {appliedCoupon.code}
                  </p>
                  <p className="text-[11px] text-dim">{appliedCoupon.description || "Promo code active"}</p>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
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
                  placeholder="Code e.g. FIRST10"
                  className="flex-1 px-3 py-2 rounded-xl border text-xs font-mono font-bold uppercase outline-none focus:border-primary"
                  style={{
                    backgroundColor: "var(--fc-bg)",
                    borderColor: "var(--fc-border)",
                  }}
                />
                <button
                  type="submit"
                  disabled={validatingCoupon}
                  className="px-4 py-2 rounded-xl text-xs font-bold uppercase border hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
                  style={{ borderColor: "var(--fc-border)" }}
                >
                  {validatingCoupon ? "…" : "Apply"}
                </button>
              </form>
            )}
          </div>

          {/* Items & Total Summary */}
          <div
            className="p-6 rounded-2xl border space-y-4"
            style={{
              backgroundColor: "var(--fc-surface)",
              borderColor: "var(--fc-border)",
            }}
          >
            <h3 className="font-display text-base font-bold">Order Breakdown</h3>

            <div className="divide-y max-h-56 overflow-y-auto text-xs" style={{ borderColor: "var(--fc-border)" }}>
              {items.map((i) => (
                <div key={i.id} className="flex justify-between py-2">
                  <span className="truncate max-w-[200px]">
                    {i.product.name} ({i.variant.colour}/{i.variant.size}) × {i.quantity}
                  </span>
                  <span className="font-semibold">{formatINR(Number(i.variant.price) * i.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="border-t pt-3 space-y-2 text-xs" style={{ borderColor: "var(--fc-border)" }}>
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
                <span>Shipping & Delivery</span>
                <span>{deliveryCharge === 0 ? "FREE" : formatINR(deliveryCharge)}</span>
              </div>
              <div className="flex justify-between text-base font-bold pt-3 border-t" style={{ borderColor: "var(--fc-border)" }}>
                <span>Final Payable</span>
                <span className="text-primary text-lg">{formatINR(total)}</span>
              </div>
            </div>

            {error && <p className="text-xs text-rose-500 font-semibold">{error}</p>}

            <button
              disabled={!selectedAddress || items.length === 0 || submitting}
              onClick={placeOrder}
              className="w-full py-3.5 rounded-full font-bold text-xs uppercase tracking-wider text-white shadow-lg transition-all hover:brightness-105 disabled:opacity-50"
              style={{ backgroundColor: "var(--fc-primary)" }}
            >
              {submitting
                ? "Processing Order…"
                : paymentMethod === "MANUAL_UPI"
                ? "Proceed to UPI Payment →"
                : "Place Order & Confirm →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  required,
  className,
}: {
  label: string;
  value?: string;
  onChange: (v: string) => void;
  required?: boolean;
  className?: string;
}) {
  return (
    <label className={`block text-xs ${className ?? ""}`}>
      <span className="font-bold text-dim uppercase">{label}</span>
      <input
        required={required}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full px-3.5 py-2 rounded-xl border text-xs outline-none focus:border-primary"
        style={{
          backgroundColor: "var(--fc-surface)",
          borderColor: "var(--fc-border)",
        }}
      />
    </label>
  );
}
