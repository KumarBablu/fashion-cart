"use client";

import { useEffect, useState } from "react";
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

  function handleFileChange(selected: File | null) {
    setFile(selected);
    if (selected) {
      const url = URL.createObjectURL(selected);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  }

  function copyUpiId() {
    const upi = data?.paymentSettings?.upiId || "fashioncart@okaxis";
    navigator.clipboard.writeText(upi);
    success("UPI ID Copied!", upi);
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
      <div className="mx-auto max-w-lg px-4 py-24 text-center text-sm text-dim">
        Loading payment details…
      </div>
    );
  }

  const isVerified = data.order.payment?.status === "VERIFIED" || data.order.status === "CONFIRMED";
  const isUnderReview = data.order.payment?.status === "UNDER_REVIEW" || submitted;

  if (isVerified || isUnderReview) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="p-8 rounded-3xl border space-y-4" style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}>
          <div className="text-5xl">{isVerified ? "🎉" : "⏳"}</div>
          <h1 className="font-display text-2xl font-bold">
            {isVerified ? "Payment Verified & Order Confirmed!" : "Payment Proof Under Review"}
          </h1>
          <p className="text-xs text-dim leading-relaxed max-w-sm mx-auto">
            {isVerified
              ? "We have verified your payment transaction. Your order is now confirmed and being prepared for dispatch."
              : "We have received your payment proof and UTR number. Our administration team will verify it shortly."}
          </p>

          <div className="pt-4 flex flex-col gap-2.5">
            <Link
              href={`/account/orders/${data.order.id}`}
              className="w-full py-3.5 rounded-full font-bold text-xs uppercase tracking-wider text-white shadow-md hover:brightness-105"
              style={{ backgroundColor: "var(--fc-primary)" }}
            >
              View Order Tracking & Invoice →
            </Link>
            <Link
              href="/shop"
              className="text-xs text-dim hover:text-primary transition-colors py-1"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const upiId = data.paymentSettings?.upiId || "fashioncart@okaxis";
  const amount = Number(data.order.total);

  return (
    <div className="mx-auto max-w-xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center mb-8">
        <h1 className="font-display text-3xl font-bold">Scan & Pay</h1>
        <p className="text-xs text-dim mt-1">Order #{data.order.orderNumber}</p>
      </div>

      <div
        className="rounded-3xl border p-6 sm:p-8 text-center space-y-6"
        style={{
          backgroundColor: "var(--fc-surface)",
          borderColor: "var(--fc-border)",
        }}
      >
        {/* Payable Amount Pill */}
        <div className="p-4 rounded-2xl border" style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}>
          <p className="text-xs font-bold text-dim uppercase tracking-wider">Total Amount Payable</p>
          <p className="text-3xl font-black text-primary mt-1">{formatINR(data.order.total)}</p>
        </div>

        {/* Dynamic NPCI UPI QR Code Auto-Locked to Exact Payable Amount */}
        <DynamicUpiQr
          upiId={upiId}
          amount={amount}
          orderNumber={data.order.orderNumber}
          payeeName="Fashion Cart Premium Outlet"
          staticQrPath={data.paymentSettings?.qrCodePath}
        />

        {/* Step Guide */}
        <div className="text-left p-4 rounded-2xl border text-xs space-y-1.5" style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}>
          <p className="font-bold text-primary uppercase tracking-wider">How to verify:</p>
          <ol className="list-decimal list-inside space-y-1 text-dim">
            <li>Scan QR or pay to UPI ID <strong>{upiId}</strong>.</li>
            <li>Complete the payment of <strong>{formatINR(data.order.total)}</strong>.</li>
            <li>Take a screenshot of the payment receipt.</li>
            <li>Upload the screenshot & enter the 12-digit UTR below.</li>
          </ol>
        </div>

        {/* Submission Form */}
        <form onSubmit={submitPayment} className="space-y-4 text-left pt-2">
          <div>
            <label className="block text-xs font-bold text-dim uppercase mb-1">
              Payment Screenshot *
            </label>
            <input
              type="file"
              required
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
              className="w-full text-xs file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-black/10 dark:file:bg-white/10 file:text-inherit"
            />

            {previewUrl && (
              <div className="mt-3 relative h-32 w-28 rounded-xl overflow-hidden border" style={{ borderColor: "var(--fc-border)" }}>
                <Image src={previewUrl} alt="Screenshot preview" fill unoptimized className="object-cover" />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-dim uppercase mb-1">
              UTR / UPI Transaction Reference Number *
            </label>
            <input
              type="text"
              required
              value={utr}
              onChange={(e) => setUtr(e.target.value)}
              placeholder="e.g. 329182749102"
              className="w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono font-bold outline-none focus:border-primary"
              style={{
                backgroundColor: "var(--fc-bg)",
                borderColor: "var(--fc-border)",
              }}
            />
          </div>

          {error && <p className="text-xs text-rose-500 font-semibold">{error}</p>}

          <button
            type="submit"
            disabled={submitting || !file || !utr.trim()}
            className="w-full py-3.5 rounded-full font-bold text-xs uppercase tracking-wider text-white shadow-md transition-all hover:brightness-105 disabled:opacity-50"
            style={{ backgroundColor: "var(--fc-primary)" }}
          >
            {submitting ? "Submitting Payment Proof…" : "Submit Payment Confirmation →"}
          </button>

          <div className="pt-2 text-center">
            <WhatsAppConciergeButton
              orderNumber={data.order.orderNumber}
              customMessage={`Namaste Fashion Cart Boutique! 💳 I have completed UPI payment for Order #${data.order.orderNumber} (Amount: ₹${Number(data.order.total).toLocaleString("en-IN")}). UTR Reference: ${utr || "Attached in chat"}. Please find my payment screenshot attached for verification.`}
              className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline py-1 bg-transparent border-none p-0 cursor-pointer w-full text-center"
            >
              <span>📲</span> Or Send Payment Screenshot Directly via WhatsApp
            </WhatsAppConciergeButton>
          </div>
        </form>
      </div>
    </div>
  );
}
