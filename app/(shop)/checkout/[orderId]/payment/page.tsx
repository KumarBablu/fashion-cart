"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatINR } from "@/lib/format";
import { useToast } from "@/components/providers/ToastProvider";
import WhatsAppConciergeButton from "@/components/ui/WhatsAppConciergeButton";
import DynamicUpiQr from "@/components/payments/DynamicUpiQr";

type OrderData = {
  order: {
    id: string;
    orderNumber: string;
    total: string | number;
    status: string;
    payment: { id: string; status: string; utrNumber?: string | null } | null;
  };
  paymentSettings: { qrCodePath: string | null; upiId: string | null; instructions: string | null } | null;
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
  const [showUtrHelper, setShowUtrHelper] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { success } = useToast();

  useEffect(() => {
    params.then(({ orderId }) => setOrderId(orderId));
  }, [params]);

  useEffect(() => {
    if (!orderId) return;
    fetch(`/api/orders/${orderId}`)
      .then((r) => r.json())
      .then(setData);
  }, [orderId]);

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
        setError(result?.error ?? "Could not submit payment. Please verify your file and UTR.");
        return;
      }
      setSubmitted(true);
      success("Payment Proof Submitted! 🎉", "Admin will verify your payment shortly.");
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
        <p className="text-xs uppercase tracking-widest font-bold text-[#787C87]">Initializing Boutique Payment Desk…</p>
      </div>
    );
  }

  const isVerified = data.order.payment?.status === "VERIFIED" || data.order.status === "CONFIRMED";
  const isUnderReview = data.order.payment?.status === "UNDER_REVIEW" || submitted;

  if (isVerified || isUnderReview) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center animate-in fade-in zoom-in-95 duration-400">
        <div className="p-8 sm:p-10 rounded-[32px] border border-[#E7DFD5] bg-[#FAF8F5] dark:bg-neutral-900 shadow-2xl space-y-5 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-[#C59B27]/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#141416] to-[#2B2C30] text-[#C59B27] border border-[#C59B27]/50 shadow-xl flex items-center justify-center text-3xl mx-auto">
            {isVerified ? "✓" : "⏳"}
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#C59B27]">
              {isVerified ? "Order Confirmed" : "Verification in Progress"}
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#141416] dark:text-white">
              {isVerified ? "Payment Verified & Order Confirmed!" : "Payment Proof Under Review"}
            </h1>
          </div>

          <p className="text-xs sm:text-sm text-[#5A5E69] dark:text-neutral-300 leading-relaxed max-w-sm mx-auto">
            {isVerified
              ? "We have verified your UPI payment transaction. Your boutique order is now officially confirmed and transitioning to dispatch."
              : "Your payment screenshot and UTR reference have been logged into our secure payment desk. Our verification team will process it within minutes."}
          </p>

          <div className="pt-3 flex flex-col gap-3">
            <Link
              href={`/account/orders/${data.order.id}`}
              className="w-full py-4 px-6 rounded-full font-extrabold text-xs uppercase tracking-wider bg-[#141416] text-[#C59B27] hover:bg-[#25262B] hover:text-white transition-all shadow-lg text-center block"
            >
              View Order Tracking & Invoice →
            </Link>
            <Link
              href="/shop"
              className="text-xs font-semibold text-[#787C87] hover:text-[#141416] transition-colors py-1"
            >
              ← Return to Boutique Collections
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const upiId = data.paymentSettings?.upiId || "9771039201@upi";
  const amount = Number(data.order.total);
  const isUtrValid = utr.trim().length >= 10;

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="text-center mb-8 space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FBF4E2] border border-[#C59B27]/40 text-[#8E6C0C] text-[10px] font-extrabold uppercase tracking-widest shadow-2xs">
          <span>⚜️ Official Boutique Payment Desk</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-[#141416] dark:text-white">
          Choose Payment Option & Authorize
        </h1>
        <p className="text-xs font-semibold text-[#787C87] tracking-wider">
          Order Reference: <strong className="font-mono text-[#141416] dark:text-white">#{data.order.orderNumber}</strong>
        </p>
      </div>

      {/* Main Luxury Frame */}
      <div className="rounded-[36px] border border-[#E7DFD5] bg-[#FAF8F5] dark:bg-neutral-900/90 shadow-2xl p-6 sm:p-10 space-y-8 relative overflow-hidden backdrop-blur-xs">
        
        {/* Luxury Obsidian Payable Total Header Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#141416] via-[#1C1D21] to-[#25262B] text-white p-6 sm:p-7 border border-[#C59B27]/40 shadow-xl">
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#C59B27]/15 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#C59B27] block mb-1">
                Total Amount Payable
              </span>
              <p className="text-3xl sm:text-4xl font-black tracking-tight text-white font-display">
                {formatINR(data.order.total)}
              </p>
            </div>

            <div className="flex flex-wrap sm:flex-col items-start sm:items-end gap-1.5">
              <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span>🛡️</span> 100% Direct Bank Transfer
              </span>
              <span className="text-[10px] text-white/60 font-medium">0% Gateway Convenience Fees</span>
            </div>
          </div>
        </div>

        {/* Multi-Method Dynamic Payment Desk (QR / UPI ID / Apps / Card & Bank Transfer) */}
        <DynamicUpiQr
          upiId={upiId}
          amount={amount}
          orderNumber={data.order.orderNumber}
          payeeName="Fashion Cart Premium Outlet"
          staticQrPath={data.paymentSettings?.qrCodePath}
        />

        {/* Visual 3-Step Verification Journey */}
        <div className="p-5 sm:p-6 rounded-3xl border border-[#E7DFD5] bg-white dark:bg-neutral-800/80 shadow-xs space-y-3.5 text-left">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-[#141416] dark:text-white flex items-center gap-1.5">
              <span>📋</span> Step-by-Step Payment Journey
            </span>
            <span className="text-[10px] font-bold text-[#C59B27] bg-[#FAF6EE] px-2.5 py-0.5 rounded-full border border-[#E7D6A8]">
              3 Simple Steps
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {/* Step 1 */}
            <div className="p-3 rounded-2xl bg-[#FAF8F5] dark:bg-neutral-900 border border-[#E7DFD5] space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#141416] text-[#C59B27] font-black text-[10px] flex items-center justify-center">1</span>
                <span className="text-xs font-bold text-[#141416] dark:text-white">Choose & Pay</span>
              </div>
              <p className="text-[11px] text-[#6B7280] leading-snug">
                Pay using QR Scan, UPI ID, 1-Tap App, or Bank Transfer.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-3 rounded-2xl bg-[#FAF8F5] dark:bg-neutral-900 border border-[#E7DFD5] space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#141416] text-[#C59B27] font-black text-[10px] flex items-center justify-center">2</span>
                <span className="text-xs font-bold text-[#141416] dark:text-white">Save Receipt</span>
              </div>
              <p className="text-[11px] text-[#6B7280] leading-snug">
                Take a screenshot of completed payment with 12-digit UTR.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-3 rounded-2xl bg-[#FAF8F5] dark:bg-neutral-900 border border-[#E7DFD5] space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#141416] text-[#C59B27] font-black text-[10px] flex items-center justify-center">3</span>
                <span className="text-xs font-bold text-[#141416] dark:text-white">Upload & Confirm</span>
              </div>
              <p className="text-[11px] text-[#6B7280] leading-snug">
                Upload image & enter 12-digit UTR below for priority dispatch.
              </p>
            </div>
          </div>
        </div>

        {/* Luxury Payment Confirmation Submission Form */}
        <form onSubmit={submitPayment} className="space-y-6 text-left pt-2 border-t border-[#E7DFD5] dark:border-neutral-800">
          
          {/* Screenshot Upload Dropzone */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-extrabold text-[#141416] dark:text-white uppercase tracking-wider">
                1. Upload Payment Screenshot <span className="text-rose-500">*</span>
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
                <div className="space-y-0.5">
                  <p className="text-xs sm:text-sm font-bold text-[#141416] dark:text-white">
                    Click to browse or drag & drop payment screenshot
                  </p>
                  <p className="text-[11px] text-[#787C87]">
                    Attach the payment success screen from GPay, PhonePe, or Paytm
                  </p>
                </div>
                <span className="px-4 py-1.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-[#141416] text-[#C59B27] hover:bg-[#25262B] shadow-2xs transition-colors mt-1">
                  Select Screenshot File
                </span>
              </div>
            ) : (
              <div className="p-4 rounded-3xl border border-[#C59B27]/40 bg-white dark:bg-neutral-800 flex items-center justify-between gap-4 shadow-sm animate-in fade-in">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="relative w-16 h-16 rounded-2xl overflow-hidden border border-[#E7DFD5] shrink-0 shadow-2xs">
                    <Image src={previewUrl} alt="Receipt Screenshot preview" fill unoptimized className="object-cover" />
                  </div>
                  <div className="min-w-0">
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      <span>✓</span> Screenshot Attached
                    </span>
                    <p className="text-xs font-bold text-[#141416] dark:text-white truncate max-w-[200px] sm:max-w-xs">
                      {file?.name || "Payment Receipt Screenshot"}
                    </p>
                    <p className="text-[10px] text-[#787C87]">
                      {(file ? file.size / (1024 * 1024) : 0).toFixed(2)} MB
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleFileSelection(null)}
                  className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer shrink-0"
                >
                  ✕ Remove
                </button>
              </div>
            )}
          </div>

          {/* UTR / Transaction Reference Number Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-extrabold text-[#141416] dark:text-white uppercase tracking-wider">
                2. 12-Digit UTR / UPI Reference Number <span className="text-rose-500">*</span>
              </label>
              
              <button
                type="button"
                onClick={() => setShowUtrHelper(!showUtrHelper)}
                className="text-[11px] font-bold text-[#C59B27] hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>ℹ️</span> Where to find UTR?
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                required
                value={utr}
                onChange={(e) => setUtr(e.target.value.replace(/[^a-zA-Z0-9]/g, ""))}
                placeholder="e.g. 423918274910 or UPI Reference ID"
                maxLength={24}
                className="w-full px-4 py-3.5 rounded-2xl border text-sm font-mono font-bold tracking-wider outline-none transition-all focus:border-[#C59B27] focus:ring-2 focus:ring-[#C59B27]/20 bg-white dark:bg-neutral-800"
                style={{ borderColor: isUtrValid ? "#10B981" : "#E7DFD5" }}
              />

              {isUtrValid && (
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                  ✓ Valid Format
                </span>
              )}
            </div>

            {/* Collapsible UTR Helper */}
            {showUtrHelper && (
              <div className="p-4 rounded-2xl bg-[#FAF6EE] border border-[#E7D6A8] text-xs text-[#5A5E69] space-y-1.5 animate-in fade-in">
                <p className="font-bold text-[#141416]">💡 Where to find your 12-Digit UTR Number:</p>
                <ul className="list-disc list-inside space-y-1 text-[11px]">
                  <li><strong>Google Pay</strong>: Tap the transaction ➔ Look for <strong>&quot;UPI transaction ID&quot;</strong> (12 digits).</li>
                  <li><strong>PhonePe</strong>: Tap transaction history ➔ Look for <strong>&quot;UTR&quot;</strong> under Transfer Details.</li>
                  <li><strong>Paytm</strong>: Open payment receipt ➔ Look for <strong>&quot;UPI Ref No&quot;</strong>.</li>
                </ul>
              </div>
            )}
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold animate-in shake">
              ⚠️ {error}
            </div>
          )}

          {/* Luxury Action Button */}
          <button
            type="submit"
            disabled={submitting || !file || !utr.trim()}
            className="w-full py-4 px-8 rounded-full font-black text-xs uppercase tracking-[0.2em] bg-gradient-to-r from-[#141416] via-[#2B2C30] to-[#141416] text-[#C59B27] hover:text-white hover:brightness-110 active:scale-[0.99] transition-all shadow-xl disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-[#C59B27] border-t-transparent rounded-full animate-spin" />
                <span>Validating Payment Proof…</span>
              </>
            ) : (
              <span>Submit Payment Confirmation →</span>
            )}
          </button>

          {/* Direct WhatsApp Concierge VIP Option */}
          <div className="pt-2">
            <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
              <div>
                <p className="text-xs font-extrabold text-emerald-900 dark:text-emerald-300">
                  Prefer Direct WhatsApp Verification?
                </p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                  Send payment screenshot directly to our boutique manager for 2-minute VIP approval.
                </p>
              </div>

              <WhatsAppConciergeButton
                orderNumber={data.order.orderNumber}
                customMessage={`Namaste Fashion Cart Boutique! 💳 I have completed UPI payment of ${formatINR(data.order.total)} for Order #${data.order.orderNumber}. UTR Reference: ${utr || "Attached in chat"}. Please find my payment screenshot attached for priority verification.`}
                className="px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all cursor-pointer shrink-0"
              >
                <span>📲 Chat on WhatsApp</span>
              </WhatsAppConciergeButton>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
