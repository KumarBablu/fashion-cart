"use client";

import { useEffect, useState, useCallback } from "react";
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
  product: {
    name: string;
    slug: string;
    brand?: string | null;
    images?: { imageUrl: string; altText?: string | null }[];
  };
  variant: {
    id?: string;
    colour: string;
    size: string;
    price: string | number;
    compareAtPrice?: string | number | null;
  };
};

type PaymentSettings = {
  qrCodePath?: string | null;
  upiId?: string | null;
  payeeName?: string | null;
  codEnabled?: boolean;
  codFee?: number;
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
  const [store, setStore] = useState<"garments" | "jewellery">("garments");
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);

  // Direct Buy Now state (when user clicks "Buy Now" on single product)
  const [isDirectBuy, setIsDirectBuy] = useState(false);
  const [directVariantId, setDirectVariantId] = useState<string | null>(null);
  const [directQuantity, setDirectQuantity] = useState<number>(1);

  // Coupon state
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    id: string;
    code: string;
    description?: string | null;
    discountAmount: number;
  } | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // Payment method state — default to ONLINE_GATEWAY (Razorpay) for instant automated checkout
  const [paymentMethod, setPaymentMethod] = useState<"ONLINE_GATEWAY" | "MANUAL_UPI" | "COD">("ONLINE_GATEWAY");
  const [customerNotes, setCustomerNotes] = useState("");

  function getActiveStore(): "garments" | "jewellery" {
    if (typeof window === "undefined") return "garments";
    const urlParams = new URLSearchParams(window.location.search);
    const storeParam = urlParams.get("store");
    if (storeParam === "jewellery") return "jewellery";
    if (storeParam === "garments") return "garments";
    const match = document.cookie.match(/(?:^|;\s*)fc_store=([^;]+)/);
    if (match && match[1] === "jewellery") return "jewellery";
    const saved = sessionStorage.getItem("fc_active_store");
    if (saved === "jewellery") return "jewellery";
    return "garments";
  }

  const loadAll = useCallback(async () => {
    const activeStore = getActiveStore();
    setStore(activeStore);

    let direct = false;
    let varId: string | null = null;
    let qty = 1;

    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      direct = urlParams.get("direct") === "true";
      varId = urlParams.get("variantId");
      qty = Math.max(1, parseInt(urlParams.get("quantity") || "1", 10));
      setIsDirectBuy(direct);
      setDirectVariantId(varId);
      setDirectQuantity(qty);
    }

    try {
      const cartUrl = direct && varId
        ? `/api/cart?direct=true&variantId=${varId}&quantity=${qty}&store=${activeStore}`
        : `/api/cart?store=${activeStore}`;

      const [addrRes, cartRes] = await Promise.all([
        fetch("/api/addresses"),
        fetch(cartUrl),
      ]);
      if (addrRes.status === 401) {
        const nextUrl = window.location.pathname + window.location.search;
        router.push(`/login?next=${encodeURIComponent(nextUrl)}`);
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
  }, [router]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Load Razorpay script dynamically
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (document.getElementById("razorpay-checkout-script")) return;
    const script = document.createElement("script");
    script.id = "razorpay-checkout-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
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
  const baseDeliveryCharge = subtotal >= 999 || subtotal === 0 ? 0 : 49;
  const codFee = paymentMethod === "COD" && paymentSettings?.codFee ? Number(paymentSettings.codFee) : 0;
  const deliveryCharge = baseDeliveryCharge + codFee;
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
        body: JSON.stringify({ code: couponInput.trim(), subtotal, store }),
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

  /**
   * Razorpay Online Payment Flow with Real-Time Cryptographic Verification
   */
  async function handleRazorpayPayment() {
    if (!selectedAddress) {
      setError("Please select a delivery address.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // 1. Create Razorpay order on our Next.js backend
      const res = await fetch("/api/payments/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addressId: selectedAddress,
          couponCode: appliedCoupon?.code || undefined,
          customerNotes: customerNotes.trim() || undefined,
          store,
          variantId: isDirectBuy && directVariantId ? directVariantId : undefined,
          quantity: isDirectBuy ? directQuantity : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Could not initialize payment gateway.");
        setSubmitting(false);
        return;
      }

      // Check if Razorpay script is loaded
      const RazorpayWindow = (window as unknown as { Razorpay: any }).Razorpay;
      if (!RazorpayWindow) {
        setError("Payment gateway is loading. Please try again in 3 seconds.");
        setSubmitting(false);
        return;
      }

      // 2. Open official Razorpay modal
      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency || "INR",
        name: store === "jewellery" ? "Fashion Cart Jewellery" : "Fashion Cart",
        description: `Order #${data.orderNumber}`,
        image: "/fashion-cart-logo-transparent.svg",
        order_id: data.razorpayOrderId,
        prefill: {
          name: data.customer?.name || "",
          email: data.customer?.email || "",
          contact: data.customer?.phone || "",
        },
        notes: {
          orderId: data.orderId,
          orderNumber: data.orderNumber,
          store,
        },
        theme: {
          color: store === "jewellery" ? "#C59B27" : "#0C3B2E",
        },
        modal: {
          ondismiss: function () {
            setSubmitting(false);
          },
        },
        handler: async function (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) {
          // 3. Auto-verify HMAC signature on backend
          try {
            const verifyRes = await fetch("/api/payments/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: data.orderId,
                store,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();

            if (verifyRes.ok && verifyData.success) {
              window.dispatchEvent(new CustomEvent("cart-updated"));
              success(
                "Payment Verified! 🎉",
                `Order #${data.orderNumber} placed & confirmed successfully.`
              );
              router.push(`/account/orders/${data.orderId}`);
            } else {
              toastError(
                "Verification Notice",
                verifyData.error || "Payment received. Verification in progress."
              );
              router.push(`/checkout/${data.orderId}/payment${store === "jewellery" ? "?store=jewellery" : ""}`);
            }
          } catch {
            toastError("Payment Recorded", "Payment completed. Verifying order...");
            router.push(`/checkout/${data.orderId}/payment${store === "jewellery" ? "?store=jewellery" : ""}`);
          }
        },
      };

      const razorpayInstance = new RazorpayWindow(options);
      razorpayInstance.on("payment.failed", function (failResponse: any) {
        setSubmitting(false);
        const reason = failResponse?.error?.description || "Payment was not completed.";
        setError(`Payment failed: ${reason}`);
      });

      razorpayInstance.open();
    } catch {
      setError("Network error while starting online payment.");
      setSubmitting(false);
    }
  }

  /**
   * Manual UPI / COD Order Flow
   */
  async function placeStandardOrder() {
    if (!selectedAddress) {
      setError("Please select a delivery address.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders?store=${store}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addressId: selectedAddress,
          couponCode: appliedCoupon?.code || undefined,
          paymentMethod,
          customerNotes: customerNotes.trim() || undefined,
          store,
          variantId: isDirectBuy && directVariantId ? directVariantId : undefined,
          quantity: isDirectBuy ? directQuantity : undefined,
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
        router.push(`/checkout/${data.order.id}/payment${store === "jewellery" ? "?store=jewellery" : ""}`);
      } else {
        success(
          "Order Confirmed! 🚚",
          `Order #${data.order.orderNumber} placed successfully.`
        );
        router.push(`/account/orders/${data.order.id}`);
      }
    } catch {
      setError("Network error while placing order.");
      setSubmitting(false);
    }
  }

  function handleOrderSubmit() {
    if (paymentMethod === "ONLINE_GATEWAY") {
      handleRazorpayPayment();
    } else {
      placeStandardOrder();
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
        <h1 className="font-display text-2xl font-bold">Your {store === "jewellery" ? "Jewellery" : "Garments"} cart is empty</h1>
        <p className="text-xs text-dim mt-2">Add items to your boutique cart before proceeding to checkout.</p>
        <button
          onClick={() => router.push(store === "jewellery" ? "/jewellery" : "/garments")}
          className="mt-6 px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider text-white cursor-pointer"
          style={{ backgroundColor: store === "jewellery" ? "#C59B27" : "var(--fc-primary)" }}
        >
          Explore {store === "jewellery" ? "Jewellery Boutique" : "Garments Boutique"} →
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
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
        {/* Left Column: Address & Payment */}
        <div className="space-y-8 animate-luxury-up">
          {/* 1. Address Selection */}
          <section
            className="p-6 rounded-2xl border space-y-4 shadow-sm"
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
                  className="text-xs font-bold text-primary hover:underline cursor-pointer"
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
                  <button type="submit" className="px-5 py-2 rounded-full text-xs font-bold uppercase text-white cursor-pointer" style={{ backgroundColor: "var(--fc-primary)" }}>
                    Save Address
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-full border text-xs text-dim cursor-pointer" style={{ borderColor: "var(--fc-border)" }}>
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </section>

          {/* 2. Payment Method Selector */}
          <section
            className="p-6 rounded-2xl border space-y-4 shadow-sm"
            style={{
              backgroundColor: "var(--fc-surface)",
              borderColor: "var(--fc-border)",
            }}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">2. Payment Method</h2>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200">
                🔒 256-Bit SSL Encrypted
              </span>
            </div>

            <div className="space-y-3">
              {/* Option 1: Instant Online Payment (Razorpay) */}
              <label
                className={`flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer transition-all ${
                  paymentMethod === "ONLINE_GATEWAY"
                    ? "border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-xs ring-1 ring-emerald-600"
                    : "opacity-80 hover:opacity-100"
                }`}
                style={{
                  backgroundColor: paymentMethod === "ONLINE_GATEWAY" ? undefined : "var(--fc-bg)",
                  borderColor: paymentMethod === "ONLINE_GATEWAY" ? undefined : "var(--fc-border)",
                }}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === "ONLINE_GATEWAY"}
                  onChange={() => setPaymentMethod("ONLINE_GATEWAY")}
                  className="mt-1"
                />
                <div className="flex-1 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-sm text-[#0C3B2E] dark:text-emerald-300 flex items-center gap-1.5">
                      <span>⚡ Instant Online Payment</span>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                        Auto-Confirmed
                      </span>
                    </p>
                  </div>
                  <p className="text-dim leading-relaxed">
                    Pay securely via <strong>UPI (GPay, PhonePe, Paytm, CRED)</strong>, Credit/Debit Cards, NetBanking & Wallets. Instant verification & immediate dispatch queue.
                  </p>
                  <div className="pt-1.5 flex flex-wrap items-center gap-2 text-[10px] font-semibold text-[#0C3B2E] dark:text-emerald-400">
                    <span className="px-2 py-0.5 rounded-md bg-[#0C3B2E]/10 dark:bg-emerald-900/40 font-mono">GPay / PhonePe</span>
                    <span className="px-2 py-0.5 rounded-md bg-[#0C3B2E]/10 dark:bg-emerald-900/40 font-mono">Cards & NetBanking</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">✓ Instant Invoice</span>
                  </div>
                </div>
              </label>

              {/* Option 2: Manual UPI QR & Screenshot */}
              <label
                className={`flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer transition-all ${
                  paymentMethod === "MANUAL_UPI"
                    ? "border-primary bg-[#F2EFE8] dark:bg-neutral-800 shadow-xs ring-1 ring-primary"
                    : "opacity-80 hover:opacity-100"
                }`}
                style={{
                  backgroundColor: paymentMethod === "MANUAL_UPI" ? undefined : "var(--fc-bg)",
                  borderColor: paymentMethod === "MANUAL_UPI" ? undefined : "var(--fc-border)",
                }}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === "MANUAL_UPI"}
                  onChange={() => setPaymentMethod("MANUAL_UPI")}
                  className="mt-1"
                />
                <div className="flex-1 text-xs space-y-1">
                  <p className="font-bold text-sm text-[#0C3B2E] dark:text-white flex items-center gap-1.5">
                    <span>📲 Manual UPI QR Scan & Pay</span>
                    <span className="text-[10px] font-bold bg-[#FFBA00]/30 text-[#0C3B2E] px-2 py-0.5 rounded-md">
                      0% Fee
                    </span>
                  </p>
                  <p className="text-dim leading-relaxed">
                    Scan our boutique QR on the next screen, pay with any UPI app, and attach your screenshot or UTR number.
                  </p>
                </div>
              </label>

              {/* Option 3: Cash on Delivery (COD) */}
              <label
                className={`flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer transition-all ${
                  paymentMethod === "COD"
                    ? "border-primary bg-[#F2EFE8] dark:bg-neutral-800 shadow-xs ring-1 ring-primary"
                    : "opacity-80 hover:opacity-100"
                }`}
                style={{
                  backgroundColor: paymentMethod === "COD" ? undefined : "var(--fc-bg)",
                  borderColor: paymentMethod === "COD" ? undefined : "var(--fc-border)",
                }}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === "COD"}
                  onChange={() => setPaymentMethod("COD")}
                  className="mt-1"
                />
                <div className="flex-1 text-xs space-y-1">
                  <p className="font-bold text-sm text-[#0C3B2E] dark:text-white">
                    🚚 Cash on Delivery (COD)
                  </p>
                  <p className="text-dim leading-relaxed">
                    Pay in cash or UPI directly to the delivery partner when your parcel arrives.
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
                placeholder="e.g. Please call before delivery or leave with building security."
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
        <div className="space-y-6 animate-luxury-up" style={{ animationDelay: "120ms" }}>
          {/* Coupon Box */}
          <div
            className="p-5 rounded-2xl border space-y-3 shadow-xs"
            style={{
              backgroundColor: "var(--fc-surface)",
              borderColor: "var(--fc-border)",
            }}
          >
            <p className="text-xs font-bold uppercase tracking-wider text-dim">🏷️ Apply Promo Coupon</p>

            {appliedCoupon ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs animate-fade-in">
                <div>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    ✓ {appliedCoupon.code}
                  </p>
                  <p className="text-[11px] text-dim">{appliedCoupon.description || "Promo code active"}</p>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="text-xs text-rose-500 font-bold hover:underline cursor-pointer"
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
                  className="px-4 py-2 rounded-xl text-xs font-bold uppercase border hover:bg-black/5 dark:hover:bg-white/5 transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
                  style={{ borderColor: "var(--fc-border)" }}
                >
                  {validatingCoupon ? "…" : "Apply"}
                </button>
              </form>
            )}
          </div>

          {/* Items & Total Summary */}
          <div
            className="p-6 rounded-2xl border space-y-4 shadow-sm"
            style={{
              backgroundColor: "var(--fc-surface)",
              borderColor: "var(--fc-border)",
            }}
          >
            <div className="flex items-center justify-between pb-1 border-b" style={{ borderColor: "var(--fc-border)" }}>
              <div>
                <h3 className="font-display text-base font-bold text-[#141416] dark:text-white">Order Breakdown</h3>
                <p className="text-[11px] text-dim">
                  {isDirectBuy ? "Direct Express Checkout (Single Product)" : "Shopping Bag Checkout"}
                </p>
              </div>
              <span
                className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border shadow-2xs ${
                  isDirectBuy
                    ? "bg-[#FBF4E2] text-[#8E6C0C] border-[#C59B27]/40"
                    : "bg-[#0C3B2E]/10 text-[#0C3B2E] dark:bg-emerald-950/40 dark:text-emerald-300 border-[#0C3B2E]/20"
                }`}
              >
                {isDirectBuy ? "⚡ Direct Buy" : `🛍️ ${items.length} ${items.length === 1 ? "Item" : "Items"}`}
              </span>
            </div>

            <div className="divide-y max-h-72 overflow-y-auto space-y-3 pt-1 pr-1" style={{ borderColor: "var(--fc-border)" }}>
              {items.map((i) => {
                const img = i.product.images?.[0]?.imageUrl || "/fashion-cart-logo-transparent.svg";
                const unitPrice = Number(i.variant.price);
                const compareAt = i.variant.compareAtPrice ? Number(i.variant.compareAtPrice) : null;
                return (
                  <div key={i.id} className="flex gap-3 pt-3 items-center first:pt-0">
                    <div className="relative h-16 w-13 rounded-xl overflow-hidden bg-[#F4EFEA] border border-[#E7DFD5] shrink-0 shadow-2xs">
                      <Image
                        src={img}
                        alt={i.product.name}
                        fill
                        sizes="52px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      {i.product.brand && (
                        <p className="text-[9px] font-extrabold uppercase tracking-wider text-[#C59B27] truncate">
                          {i.product.brand}
                        </p>
                      )}
                      <p className="font-bold text-xs text-[#141416] dark:text-white truncate" title={i.product.name}>
                        {i.product.name}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FAF8F5] dark:bg-neutral-800 border border-[#E7DFD5] dark:border-neutral-700 text-[#141416] dark:text-neutral-200">
                          {i.variant.colour}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FAF8F5] dark:bg-neutral-800 border border-[#E7DFD5] dark:border-neutral-700 text-[#141416] dark:text-neutral-200">
                          Size: {i.variant.size}
                        </span>
                        <span className="text-[10px] font-bold text-dim bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-md">
                          Qty: {i.quantity}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono font-bold text-xs text-[#141416] dark:text-white">
                        {formatINR(unitPrice * i.quantity)}
                      </p>
                      {compareAt && compareAt > unitPrice && (
                        <p className="text-[10px] text-dim line-through">
                          {formatINR(compareAt * i.quantity)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
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
                <span>{baseDeliveryCharge === 0 ? "FREE" : formatINR(baseDeliveryCharge)}</span>
              </div>
              {codFee > 0 && (
                <div className="flex justify-between text-dim">
                  <span>COD Handling Fee</span>
                  <span>{formatINR(codFee)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold pt-3 border-t" style={{ borderColor: "var(--fc-border)" }}>
                <span>Final Payable</span>
                <span className="text-primary text-lg">{formatINR(total)}</span>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold">
                ⚠️ {error}
              </div>
            )}

            <button
              disabled={!selectedAddress || items.length === 0 || submitting}
              onClick={handleOrderSubmit}
              className={`w-full py-4 rounded-full font-bold text-xs uppercase tracking-wider text-white shadow-xl transition-all hover:brightness-105 active:scale-95 disabled:opacity-50 cursor-pointer luxury-card-hover ${
                store === "jewellery" ? "gold-jewellery-btn" : "gold-btn"
              }`}
              style={{
                background:
                  paymentMethod === "ONLINE_GATEWAY"
                    ? "linear-gradient(135deg, #0C3B2E 0%, #175443 100%)"
                    : "linear-gradient(135deg, #141416 0%, #25262B 100%)",
                border: "1px solid rgba(197, 155, 39, 0.4)",
              }}
            >
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Connecting Payment Gateway…
                </span>
              ) : paymentMethod === "ONLINE_GATEWAY" ? (
                `⚡ Pay ${formatINR(total)} via Razorpay →`
              ) : paymentMethod === "MANUAL_UPI" ? (
                "Proceed to UPI QR Scan →"
              ) : (
                "Place Order (Cash on Delivery) →"
              )}
            </button>

            <div className="flex items-center justify-center gap-4 text-[10px] text-dim pt-1 font-semibold">
              <span>🛡️ 100% Buyer Protection</span>
              <span>•</span>
              <span>⚡ Instant Auto-Verification</span>
            </div>
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
