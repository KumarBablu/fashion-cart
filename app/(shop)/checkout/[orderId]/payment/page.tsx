"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { formatINR } from "@/lib/format";
import { useToast } from "@/components/providers/ToastProvider";
import WhatsAppConciergeButton from "@/components/ui/WhatsAppConciergeButton";
import DynamicUpiQr from "@/components/payments/DynamicUpiQr";

type OrderItemData = {
  id: string;
  productNameSnapshot: string;
  sizeSnapshot: string;
  colourSnapshot: string;
  quantity: number;
  unitPrice: string | number;
  total: string | number;
  product?: {
    images?: { url: string; altText?: string | null }[];
  };
};

type OrderData = {
  order: {
    id: string;
    orderNumber: string;
    subtotal: string | number;
    discount: string | number;
    deliveryCharge: string | number;
    total: string | number;
    status: string;
    createdAt: string;
    shippingAddressSnapshot?: {
      fullName?: string;
      mobileNumber?: string;
      addressLine1?: string;
      addressLine2?: string;
      city?: string;
      state?: string;
      pinCode?: string;
      landmark?: string;
    } | null;
    items?: OrderItemData[];
    payment: {
      id: string;
      status: string;
      utrNumber?: string | null;
      screenshotPath?: string | null;
      rejectionReason?: string | null;
      submittedAt?: string | null;
      verifiedAt?: string | null;
    } | null;
  };
  paymentSettings: {
    qrCodePath: string | null;
    upiId: string | null;
    instructions: string | null;
  } | null;
};

export default function PaymentPage({ params }: { params: Promise<{ orderId: string }> }) {
  const [orderId, setOrderId] = useState<string | null>(null);
  const [data, setData] = useState<OrderData | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [utr, setUtr] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showOrderItems, setShowOrderItems] = useState(false);
  const [showUtrHelper, setShowUtrHelper] = useState(false);
  const [refreshingStatus, setRefreshingStatus] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadFormRef = useRef<HTMLFormElement | null>(null);
  const searchParams = useSearchParams();
  const { success } = useToast();

  useEffect(() => {
    params.then(({ orderId }) => setOrderId(orderId));
  }, [params]);

  // Initial load
  useEffect(() => {
    if (!orderId) return;
    fetch(`/api/orders/${orderId}`)
      .then((r) => r.json())
      .then(setData);
  }, [orderId]);

  // Real-time live polling for Admin Payment Approval (every 3 seconds)
  useEffect(() => {
    if (!orderId) return;
    const interval = setInterval(() => {
      fetch(`/api/orders/${orderId}`)
        .then((r) => r.json())
        .then((fresh) => {
          if (fresh?.order) {
            setData(fresh);
          }
        })
        .catch(() => {});
    }, 3000);

    return () => clearInterval(interval);
  }, [orderId]);

  // Detect return from UPI app and capture any transaction reference
  useEffect(() => {
    const isPaidParam = searchParams.get("paid") === "true";
    const appRef = searchParams.get("ApprovalRefNo") || searchParams.get("approvalRefNo") || searchParams.get("txnId") || searchParams.get("txnRef") || searchParams.get("refId");
    const statusParam = searchParams.get("Status") || searchParams.get("status") || searchParams.get("responseCode");
    const hadAppLaunch = typeof window !== "undefined" && sessionStorage.getItem("fc_app_payment_initiated") === "true";

    if (appRef && !utr) {
      setUtr(appRef);
      success("Payment Reference Detected", `Auto-filled UTR: #${appRef}`);
    }

    if (isPaidParam || hadAppLaunch || statusParam) {
      setTimeout(() => {
        uploadFormRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 500);
    }
  }, [searchParams, utr, success]);

  function manualCheckStatus() {
    if (!orderId) return;
    setRefreshingStatus(true);
    fetch(`/api/orders/${orderId}`)
      .then((r) => r.json())
      .then((fresh) => {
        setRefreshingStatus(false);
        if (fresh?.order) {
          setData(fresh);
          if (fresh.order.payment?.status === "VERIFIED" || fresh.order.status === "CONFIRMED") {
            success("Payment Verified! 🎉", "Your order has been officially confirmed.");
          } else {
            success("Status Updated", `Current status: ${fresh.order.payment?.status || fresh.order.status}`);
          }
        }
      })
      .catch(() => setRefreshingStatus(false));
  }

  function handleFileSelection(selected: File | null) {
    if (!selected) {
      setFile(null);
      setPreviewUrl(null);
      return;
    }

    if (!selected.type.startsWith("image/")) {
      setError("Please upload a valid image screenshot (JPEG, PNG, WebP).");
      return;
    }

    if (selected.size > 10 * 1024 * 1024) {
      setError("Image size exceeds 10MB limit.");
      return;
    }

    setError(null);
    setFile(selected);
    const url = URL.createObjectURL(selected);
    setPreviewUrl(url);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  }

  async function submitPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!data?.order.payment?.id || !file) return;
    setSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("utrNumber", utr.trim());

    try {
      const res = await fetch(`/api/payments/${data.order.payment.id}/screenshot`, {
        method: "POST",
        body: formData,
      });
      const result = await res.json().catch(() => null);
      setSubmitting(false);

      if (!res.ok) {
        setError(result?.error ?? "Could not submit payment. Please verify your file and 12-digit UTR.");
        return;
      }
      setSubmitted(true);
      success("Payment Proof Submitted! 🎉", "Admin will verify your payment shortly.");
      
      // Refresh order data
      if (orderId) {
        fetch(`/api/orders/${orderId}`).then((r) => r.json()).then(setData);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error while submitting proof.";
      setError(msg);
      setSubmitting(false);
    }
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-lg px-4 py-28 text-center space-y-3">
        <div className="w-10 h-10 border-3 border-[#C59B27] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs uppercase tracking-widest font-bold text-[#787C87]">Loading Boutique Payment Desk…</p>
      </div>
    );
  }

  const isVerified = data.order.payment?.status === "VERIFIED" || data.order.status === "CONFIRMED";
  const isRejected = data.order.payment?.status === "REJECTED";
  const isUnderReview = (data.order.payment?.status === "UNDER_REVIEW" || submitted) && !isRejected;
  const address = data.order.shippingAddressSnapshot;
  const items = data.order.items || [];
  const upiId = data.paymentSettings?.upiId || "9771039201@upi";
  const amount = Number(data.order.total);
  const isUtrValid = utr.trim().length >= 10;

  // Render Rejected / Verification Unsuccessful View
  if (isRejected) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center animate-in fade-in zoom-in-95 duration-300">
        <div className="p-7 sm:p-8 rounded-[32px] border border-rose-200 bg-white dark:bg-neutral-900 shadow-xl space-y-5 text-left">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center text-2xl shadow-md shrink-0">
              ✕
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-600">
                Action Required
              </span>
              <h1 className="font-display text-xl font-bold text-[#141416] dark:text-white">
                Payment Verification Issue
              </h1>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
            <p className="font-bold">Reason:</p>
            <p className="text-[11px] leading-relaxed">
              {data.order.payment?.rejectionReason || "UTR number or screenshot mismatched."}
            </p>
          </div>

          <div className="pt-1 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setFile(null);
                setPreviewUrl(null);
                setUtr("");
                setError(null);
                if (data.order.payment) {
                  data.order.payment.status = "PAYMENT_PENDING";
                }
              }}
              className="w-full py-3 px-5 rounded-full font-bold text-xs uppercase tracking-wider bg-[#141416] text-[#C59B27] hover:bg-[#25262B] hover:text-white transition-all shadow-md text-center cursor-pointer block"
            >
              🔁 Re-Submit Screenshot & UTR →
            </button>
            <Link
              href="/shop"
              className="text-xs font-semibold text-[#787C87] hover:text-[#141416] transition-colors py-1 text-center"
            >
              ← Back to Boutique
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Render Confirmation or Under Review View
  if (isVerified || isUnderReview) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center animate-in fade-in zoom-in-95 duration-300">
        <div className="p-7 sm:p-8 rounded-[32px] border border-[#E7DFD5] bg-white dark:bg-neutral-900 shadow-xl space-y-5 text-left">
          
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-md shrink-0 ${
              isVerified ? "bg-emerald-600 text-white" : "bg-[#141416] text-[#C59B27] border border-[#C59B27]/40"
            }`}>
              {isVerified ? "✓" : "⏳"}
            </div>
            <div>
              <span className={`text-[10px] font-black uppercase tracking-wider ${isVerified ? "text-emerald-700" : "text-[#C59B27]"}`}>
                {isVerified ? "Confirmed & Invoiced" : "Payment Proof Received"}
              </span>
              <h1 className="font-display text-xl sm:text-2xl font-bold text-[#141416] dark:text-white">
                {isVerified ? "Payment Confirmed!" : "Verification in Progress"}
              </h1>
            </div>
          </div>

          <p className="text-xs text-[#5A5E69] dark:text-neutral-300 leading-relaxed">
            {isVerified
              ? "Payment verified. Your order is confirmed and queued for priority dispatch."
              : "Your payment proof has been recorded. Our team will verify and confirm your order shortly."}
          </p>

          {/* Quick Summary Card */}
          <div className="p-4 rounded-2xl bg-[#FAF8F5] dark:bg-neutral-800 border border-[#E7DFD5] space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#787C87]">Order Reference:</span>
              <span className="font-mono font-bold text-[#141416] dark:text-white">#{data.order.orderNumber}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#787C87]">Amount Paid:</span>
              <span className="font-mono font-black text-emerald-600">{formatINR(data.order.total)}</span>
            </div>
            {data.order.payment?.utrNumber && (
              <div className="flex items-center justify-between">
                <span className="text-[#787C87]">UTR Number:</span>
                <span className="font-mono font-bold text-[#141416] dark:text-white">{data.order.payment.utrNumber}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-1 border-t border-[#E7DFD5]">
              <span className="text-[#787C87]">Status:</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                isVerified ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
              }`}>
                {isVerified ? "Verified ✓" : "Under Review ⏳"}
              </span>
            </div>
          </div>

          {!isVerified && (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#FAF6EE] border border-[#E7D6A8] text-xs text-[#5A5E69]">
              <span>Waiting for approval?</span>
              <button
                type="button"
                onClick={manualCheckStatus}
                disabled={refreshingStatus}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#141416] text-[#C59B27] hover:bg-[#25262B] transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                {refreshingStatus && <span className="w-3 h-3 border-2 border-[#C59B27] border-t-transparent rounded-full animate-spin" />}
                <span>{refreshingStatus ? "Checking…" : "🔄 Refresh"}</span>
              </button>
            </div>
          )}

          <div className="pt-1 flex flex-col gap-2.5">
            <Link
              href={`/account/orders/${data.order.id}`}
              className="w-full py-3 px-5 rounded-full font-bold text-xs uppercase tracking-wider bg-[#141416] text-[#C59B27] hover:bg-[#25262B] hover:text-white transition-all shadow-md text-center block"
            >
              View Order Tracking & Invoice →
            </Link>
            <Link
              href="/shop"
              className="text-xs font-semibold text-[#787C87] hover:text-[#141416] transition-colors py-1 text-center"
            >
              ← Back to Boutique
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-in fade-in duration-300 space-y-6">
      
      {/* Header Banner */}
      <div className="text-center space-y-1.5">
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#FBF4E2] border border-[#C59B27]/40 text-[#8E6C0C] text-[10px] font-extrabold uppercase tracking-widest shadow-2xs">
          <span>⚜️ Secure Boutique Payment</span>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#141416] dark:text-white">
          Complete Your Payment
        </h1>
        <p className="text-xs font-semibold text-[#787C87] tracking-wider">
          Order Reference: <strong className="font-mono text-[#141416] dark:text-white">#{data.order.orderNumber}</strong>
        </p>
      </div>

      {/* Main Luxury Container */}
      <div className="rounded-[32px] border border-[#E7DFD5] bg-[#FAF8F5] dark:bg-neutral-900/90 shadow-xl p-5 sm:p-8 space-y-6 relative overflow-hidden backdrop-blur-xs">
        
        {/* Step Progression Bar */}
        <div className="flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-neutral-800 border border-[#E7DFD5] text-xs">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#141416] text-[#C59B27] flex items-center justify-center font-bold text-[10px]">1</span>
            <span className="font-bold text-[#141416] dark:text-white text-[11px] sm:text-xs">Pay via UPI App / QR</span>
          </div>
          <span className="text-[#C59B27] font-black text-xs">➔</span>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#C59B27] text-white flex items-center justify-center font-bold text-[10px]">2</span>
            <span className="font-bold text-[#141416] dark:text-white text-[11px] sm:text-xs">Attach Screenshot to Confirm</span>
          </div>
        </div>

        {/* 1. BASIC ORDER DETAILS & AMOUNT SUMMARY CARD */}
        <div className="rounded-3xl bg-white dark:bg-neutral-800/90 border border-[#E7DFD5] p-5 sm:p-6 shadow-sm space-y-4 text-left">
          
          {/* Header Row */}
          <div className="flex items-center justify-between border-b border-[#E7DFD5] pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#787C87]">
                  Order Summary
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                  ⏳ Payment Pending
                </span>
              </div>
              <p className="font-mono text-sm font-black text-[#141416] dark:text-white mt-0.5">
                #{data.order.orderNumber}
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#787C87] block">
                Total Payable
              </span>
              <p className="text-xl sm:text-2xl font-black text-[#C59B27] font-display">
                {formatINR(data.order.total)}
              </p>
            </div>
          </div>

          {/* Shipping Address Summary Snapshot */}
          {address && (
            <div className="p-3 rounded-2xl bg-[#FAF8F5] dark:bg-neutral-900 border border-[#E7DFD5] text-xs text-[#5A5E69] space-y-1">
              <p className="font-bold text-[#141416] dark:text-white flex items-center gap-1.5">
                <span>📍</span> Deliver To: {address.fullName || "Customer"} ({address.mobileNumber})
              </p>
              <p className="text-[11px] text-[#787C87] truncate">
                {[address.addressLine1, address.addressLine2, address.city, address.state, address.pinCode].filter(Boolean).join(", ")}
              </p>
            </div>
          )}

          {/* Collapsible Ordered Items List */}
          {items.length > 0 && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowOrderItems(!showOrderItems)}
                className="w-full flex items-center justify-between text-xs font-bold text-[#141416] dark:text-white py-1 hover:text-[#C59B27] transition-colors cursor-pointer"
              >
                <span>📦 {items.length} Item{items.length > 1 ? "s" : ""} in Order</span>
                <span className="text-xs text-[#787C87]">{showOrderItems ? "▲ Hide Items" : "▼ View Items"}</span>
              </button>

              {showOrderItems && (
                <div className="space-y-2 pt-1 divide-y divide-[#E7DFD5] animate-in fade-in duration-200">
                  {items.map((item) => {
                    const imgUrl = item.product?.images?.[0]?.url;
                    return (
                      <div key={item.id} className="pt-2 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {imgUrl ? (
                            <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-[#FAF8F5] shrink-0 border border-[#E7DFD5]">
                              <Image src={imgUrl} alt={item.productNameSnapshot} fill className="object-cover" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] shrink-0 flex items-center justify-center text-xs">
                              👗
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-[#141416] dark:text-white truncate">{item.productNameSnapshot}</p>
                            <p className="text-[10px] text-[#787C87]">
                              Size: {item.sizeSnapshot} · Qty: {item.quantity}
                            </p>
                          </div>
                        </div>
                        <p className="font-mono font-bold text-[#141416] dark:text-white shrink-0">
                          {formatINR(item.total)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 2. DYNAMIC PAYMENT METHOD DESK WITH CUSTOM DROPDOWN */}
        <DynamicUpiQr
          orderId={orderId || undefined}
          upiId={upiId}
          amount={amount}
          orderNumber={data.order.orderNumber}
          payeeName="Fashion Cart"
          staticQrPath={data.paymentSettings?.qrCodePath}
        />

        {/* 4. PAYMENT CONFIRMATION SUBMISSION FORM */}
        <form
          ref={uploadFormRef}
          onSubmit={submitPayment}
          className="space-y-5 text-left pt-3 border-t border-[#E7DFD5] dark:border-neutral-800"
        >
          {/* Section Title */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-[#141416] dark:text-white flex items-center gap-1.5">
              <span>📸</span> Confirm Your Payment Proof
            </span>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              Required for Dispatch
            </span>
          </div>

          {/* Screenshot Upload Dropzone */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-extrabold text-[#141416] dark:text-white uppercase tracking-wider">
                1. Attach Payment Screenshot <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] font-semibold text-[#787C87]">PNG, JPG, WebP (Max 10MB)</span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              required={!file}
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={(e) => handleFileSelection(e.target.files?.[0] ?? null)}
              className="hidden"
            />

            {!previewUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`p-6 sm:p-8 rounded-3xl border-2 border-dashed transition-all cursor-pointer text-center flex flex-col items-center justify-center space-y-2.5 ${
                  isDragging
                    ? "border-[#C59B27] bg-[#FBF4E2]"
                    : "border-[#D9D0C5] bg-white dark:bg-neutral-800/60 hover:border-[#C59B27] hover:bg-[#FAF8F5]"
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-[#FAF8F5] dark:bg-neutral-900 border border-[#E7DFD5] flex items-center justify-center text-xl shadow-2xs">
                  📸
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-extrabold text-[#141416] dark:text-white">
                    Click to Upload or Drag & Drop Receipt
                  </p>
                  <p className="text-[11px] text-[#787C87] mt-0.5">
                    Screenshot showing completed payment with UPI reference / UTR
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl border border-[#E7DFD5] bg-white dark:bg-neutral-800/80 flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-[#E7DFD5] shrink-0 bg-neutral-100">
                    <Image src={previewUrl} alt="Payment Receipt Preview" fill className="object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#141416] dark:text-white truncate">
                      {file?.name ?? "payment-screenshot.png"}
                    </p>
                    <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                      <span>✓</span> Screenshot Attached
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold border border-[#D9D0C5] text-[#141416] hover:border-[#C59B27] transition-all cursor-pointer shrink-0"
                >
                  Change File
                </button>
              </div>
            )}
          </div>

          {/* 12-Digit UTR / Transaction Reference Number */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="utr-input" className="block text-xs font-extrabold text-[#141416] dark:text-white uppercase tracking-wider">
                2. 12-Digit UPI Ref / UTR Number <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowUtrHelper(!showUtrHelper)}
                className="text-[10px] font-bold text-[#C59B27] hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>ℹ️</span> Where to find UTR?
              </button>
            </div>

            <div className="relative">
              <input
                id="utr-input"
                type="text"
                required
                value={utr}
                onChange={(e) => setUtr(e.target.value.replace(/[^0-9a-zA-Z]/g, ""))}
                placeholder="e.g. 423918274910"
                maxLength={22}
                className="w-full px-4 py-3.5 rounded-2xl border border-[#D9D0C5] dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs sm:text-sm font-mono font-bold text-[#141416] dark:text-white outline-none focus:border-[#C59B27] focus:ring-2 focus:ring-[#C59B27]/20 shadow-2xs transition-all tracking-wider"
              />
              {isUtrValid && (
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  ✓ Valid Ref
                </div>
              )}
            </div>

            {/* Collapsible UTR Helper */}
            {showUtrHelper && (
              <div className="p-3.5 rounded-2xl bg-[#FAF6EE] border border-[#E7D6A8] text-xs text-[#5A5E69] space-y-1 animate-in fade-in duration-200">
                <p className="font-bold text-[#141416]">💡 Where is my 12-digit UTR?</p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  <li><strong>Google Pay</strong>: Tap transaction ➔ Look for <strong>&quot;UPI transaction ID&quot;</strong> (12 digits).</li>
                  <li><strong>PhonePe</strong>: Tap transaction ➔ Look for <strong>&quot;UTR&quot;</strong>.</li>
                  <li><strong>Paytm</strong>: Tap transaction ➔ Look for <strong>&quot;UPI Ref No&quot;</strong>.</li>
                </ul>
              </div>
            )}
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 animate-in fade-in">
              ⚠️ {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || !file || !isUtrValid}
            className="w-full py-4 px-6 rounded-full font-black text-xs uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-[#141416] to-[#25262B] text-[#C59B27] hover:brightness-110 active:scale-[0.99]"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-[#C59B27] border-t-transparent rounded-full animate-spin" />
                <span>Logging Payment Proof…</span>
              </>
            ) : (
              <span>Submit Payment Proof for Verification →</span>
            )}
          </button>

          {/* VIP WhatsApp Concierge Alternative */}
          <div className="pt-2">
            <WhatsAppConciergeButton
              orderNumber={data.order.orderNumber}
              productPrice={amount}
              className="w-full justify-center"
            />
          </div>
        </form>
      </div>
    </div>
  );
}
