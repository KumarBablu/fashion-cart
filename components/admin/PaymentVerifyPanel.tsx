"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { formatINR } from "@/lib/format";

type Payment = {
  id: string;
  status: string;
  amount: number;
  utrNumber: string | null;
  screenshotPath: string | null;
  submittedAt: string | null;
  rejectionReason: string | null;
  orderId?: string | null;
  orderNumber?: string | null;
};

export default function PaymentVerifyPanel({ payment }: { payment: Payment }) {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState(payment.status);
  const [rejectionReason, setRejectionReason] = useState(payment.rejectionReason);
  const [reason, setReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Zoom / Lightbox State
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  async function approve() {
    // 1. Instant Optimistic UI Update (<10ms)
    setCurrentStatus("VERIFIED");
    setError(null);
    setBusy(true);

    try {
      const res = await fetch(`/api/admin/payments/${payment.id}/approve`, { method: "POST" });
      const data = await res.json();
      setBusy(false);
      if (!res.ok) {
        // Revert on error
        setCurrentStatus(payment.status);
        setError(data.error || "Failed to verify payment.");
        return;
      }
      router.refresh();
    } catch (err: any) {
      setCurrentStatus(payment.status);
      setBusy(false);
      setError(err.message || "Network error while approving.");
    }
  }

  async function reject() {
    if (!reason.trim()) {
      setError("Please provide a reason for rejection.");
      return;
    }

    const previousStatus = currentStatus;
    // Instant Optimistic Update
    setCurrentStatus("REJECTED");
    setRejectionReason(reason);
    setShowRejectForm(false);
    setError(null);
    setBusy(true);

    try {
      const res = await fetch(`/api/admin/payments/${payment.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      setBusy(false);
      if (!res.ok) {
        setCurrentStatus(previousStatus);
        setError(data.error || "Failed to reject payment.");
        return;
      }
      router.refresh();
    } catch (err: any) {
      setCurrentStatus(previousStatus);
      setBusy(false);
      setError(err.message || "Network error while rejecting.");
    }
  }

  function handleDownloadScreenshot() {
    if (!payment.screenshotPath) return;
    const a = document.createElement("a");
    a.href = payment.screenshotPath;
    a.download = `payment-proof-UTR-${payment.utrNumber || payment.id}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  const orderIdentifier = payment.orderId || payment.orderNumber;

  return (
    <div className="mt-3">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="text-xs space-y-2">
          <Row label="Amount Payable" value={formatINR(payment.amount)} />
          <Row label="UTR / Ref No" value={payment.utrNumber ?? "—"} isMono />
          <div className="flex justify-between items-center py-1">
            <span className="text-dim">Payment Status</span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider transition-all duration-200 ${
                currentStatus === "VERIFIED"
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  : currentStatus === "REJECTED"
                  ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                  : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
              }`}
            >
              {currentStatus.replace(/_/g, " ")}
            </span>
          </div>
          <Row label="Submitted" value={payment.submittedAt ? new Date(payment.submittedAt).toLocaleString("en-IN") : "—"} />
          {rejectionReason && <Row label="Rejection reason" value={rejectionReason} isDanger />}

          {/* Quick Invoice & Label Action Links */}
          {orderIdentifier && (
            <div className="pt-3 border-t border-line flex flex-col gap-2">
              <Link
                href={`/invoices/${orderIdentifier}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0C3B2E] dark:text-[#FFBA00] hover:underline"
              >
                <span>📄</span> View &amp; Print Official Tax Invoice →
              </Link>
              <Link
                href={`/invoices/${orderIdentifier}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0C3B2E] dark:text-[#FFBA00] hover:underline"
              >
                <span>📦</span> Print Parcel Shipping Label (4×6) →
              </Link>
            </div>
          )}
        </div>

        {/* Screenshot View Area with Lightbox Triggers */}
        <div>
          {payment.screenshotPath ? (
            <div className="space-y-2">
              <div
                onClick={() => setIsZoomOpen(true)}
                className="group relative h-48 w-full cursor-zoom-in overflow-hidden rounded-2xl border border-line bg-surface/50 shadow-inner"
              >
                <Image
                  src={payment.screenshotPath}
                  alt="Customer submitted payment screenshot"
                  fill
                  sizes="(max-width: 640px) 100vw, 300px"
                  className="object-contain transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
                  <span className="rounded-full bg-black/75 px-3 py-1.5 text-[11px] font-bold text-white opacity-0 backdrop-blur-xs transition-opacity group-hover:opacity-100 flex items-center gap-1">
                    🔍 Click to Inspect Full Zoom
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsZoomOpen(true)}
                  className="flex-1 rounded-xl border border-line py-1.5 text-[11px] font-semibold hover:bg-surface flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
                >
                  🔍 Full Zoom
                </button>
                <button
                  type="button"
                  onClick={handleDownloadScreenshot}
                  className="flex-1 rounded-xl border border-line py-1.5 text-[11px] font-semibold hover:bg-surface flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
                >
                  📥 Download
                </button>
              </div>
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-line text-xs text-dim">
              No screenshot uploaded yet
            </div>
          )}
        </div>
      </div>

      {error && <p className="mt-3 text-xs text-rose-500 font-semibold">{error}</p>}

      {currentStatus === "UNDER_REVIEW" && (
        <div className="mt-4 flex flex-wrap gap-2.5">
          <button
            disabled={busy}
            onClick={approve}
            className="rounded-full bg-emerald-600 hover:bg-emerald-700 px-6 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            {busy ? "✓ Verifying…" : "✓ Approve Payment"}
          </button>
          {!showRejectForm ? (
            <button
              disabled={busy}
              onClick={() => setShowRejectForm(true)}
              className="rounded-full border border-rose-500 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-rose-500 hover:bg-rose-500/10 active:scale-95 transition-all cursor-pointer"
            >
              ✕ Reject Payment
            </button>
          ) : (
            <div className="flex w-full gap-2 mt-2 animate-in fade-in">
              <input
                placeholder="Reason for rejection (e.g. Invalid UTR, wrong amount)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="flex-1 rounded-xl border border-line px-3 py-2 text-xs outline-none focus:border-rose-500"
              />
              <button
                disabled={busy}
                onClick={reject}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                Confirm Reject
              </button>
              <button
                type="button"
                onClick={() => setShowRejectForm(false)}
                className="rounded-xl border border-line px-3 py-2 text-xs font-bold text-dim hover:text-text"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {currentStatus === "VERIFIED" && (
        <div className="mt-4 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
          <span className="text-base">✨</span>
          <span>Payment Verified &amp; Confirmed — order is ready for dispatch with Tax Invoice.</span>
        </div>
      )}

      {currentStatus === "REJECTED" && (
        <div className="mt-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs font-bold text-rose-800 dark:text-rose-300 flex items-center gap-2 animate-in fade-in">
          <span className="text-base">⚠️</span>
          <span>Payment Rejected — customer notified to resubmit corrected UTR / payment proof.</span>
        </div>
      )}

      {/* Full-Screen Zoom Lightbox Modal */}
      {isZoomOpen && payment.screenshotPath && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-200">
          <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
            <button
              onClick={() => setZoomScale((s) => Math.min(s + 0.3, 3))}
              className="p-2.5 rounded-full bg-white/20 text-white hover:bg-white/30 text-sm font-bold backdrop-blur-xs cursor-pointer active:scale-90"
              title="Zoom In"
            >
              ➕
            </button>
            <button
              onClick={() => setZoomScale((s) => Math.max(s - 0.3, 0.5))}
              className="p-2.5 rounded-full bg-white/20 text-white hover:bg-white/30 text-sm font-bold backdrop-blur-xs cursor-pointer active:scale-90"
              title="Zoom Out"
            >
              ➖
            </button>
            <button
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="p-2.5 rounded-full bg-white/20 text-white hover:bg-white/30 text-sm font-bold backdrop-blur-xs cursor-pointer active:scale-90"
              title="Rotate 90°"
            >
              ⟳
            </button>
            <button
              onClick={handleDownloadScreenshot}
              className="px-3.5 py-2 rounded-full bg-[#FFBA00] text-[#0C3B2E] text-xs font-bold shadow-md hover:bg-[#EAA800] cursor-pointer active:scale-95"
              title="Download Screenshot"
            >
              📥 Download
            </button>
            <button
              onClick={() => {
                setIsZoomOpen(false);
                setZoomScale(1);
                setRotation(0);
              }}
              className="p-2.5 rounded-full bg-rose-600 text-white hover:bg-rose-700 text-sm font-bold cursor-pointer active:scale-90"
              title="Close"
            >
              ✕
            </button>
          </div>

          <div
            className="relative max-h-[85vh] max-w-[85vw] overflow-hidden rounded-2xl transition-transform duration-200"
            style={{
              transform: `scale(${zoomScale}) rotate(${rotation}deg)`,
            }}
          >
            <Image
              src={payment.screenshotPath}
              alt="Zoomed payment screenshot preview"
              width={800}
              height={1000}
              className="max-h-[85vh] w-auto rounded-2xl object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, isMono = false, isDanger = false }: { label: string; value: string; isMono?: boolean; isDanger?: boolean }) {
  return (
    <div className="flex justify-between py-0.5">
      <span className="text-dim">{label}</span>
      <span className={`font-semibold ${isMono ? "font-mono" : ""} ${isDanger ? "text-rose-600" : ""}`}>{value}</span>
    </div>
  );
}
