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
  const [reason, setReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Zoom / Lightbox State
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  async function approve() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/admin/payments/${payment.id}/approve`, { method: "POST" });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error);
      return;
    }
    router.refresh();
  }

  async function reject() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/admin/payments/${payment.id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setShowRejectForm(false);
    router.refresh();
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
        <div className="text-xs space-y-1.5">
          <Row label="Amount Payable" value={formatINR(payment.amount)} />
          <Row label="UTR / Ref No" value={payment.utrNumber ?? "—"} />
          <Row label="Payment Status" value={payment.status.replace(/_/g, " ")} />
          <Row label="Submitted" value={payment.submittedAt ? new Date(payment.submittedAt).toLocaleString("en-IN") : "—"} />
          {payment.rejectionReason && <Row label="Rejection reason" value={payment.rejectionReason} />}

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

        {/* Payment Screenshot Preview Box */}
        <div>
          {payment.screenshotPath ? (
            <div className="space-y-2">
              <div
                onClick={() => setIsZoomOpen(true)}
                className="group relative aspect-[3/4] max-h-72 w-full overflow-hidden rounded-2xl border border-line bg-slate-100 cursor-zoom-in shadow-xs transition-all hover:border-primary hover:shadow-md"
              >
                <Image
                  src={payment.screenshotPath}
                  alt="Payment screenshot proof"
                  fill
                  unoptimized
                  className="object-contain p-1 transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs gap-1">
                  <span>🔍</span> Click to Zoom &amp; Inspect
                </div>
              </div>

              {/* Action Buttons for Screenshot */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsZoomOpen(true)}
                  className="flex-1 py-1.5 px-3 rounded-lg border text-[11px] font-bold hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center justify-center gap-1"
                >
                  <span>🔍</span> Full Zoom
                </button>
                <button
                  type="button"
                  onClick={handleDownloadScreenshot}
                  className="flex-1 py-1.5 px-3 rounded-lg border text-[11px] font-bold text-primary hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center justify-center gap-1"
                >
                  <span>📥</span> Download
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-dim italic">No screenshot submitted yet.</p>
          )}
        </div>
      </div>

      {error && <p className="mt-3 text-xs text-rose-500 font-semibold">{error}</p>}

      {payment.status === "UNDER_REVIEW" && (
        <div className="mt-4 flex flex-wrap gap-2.5">
          <button
            disabled={busy}
            onClick={approve}
            className="rounded-full bg-emerald-600 px-5 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition-all"
          >
            {busy ? "Processing…" : "✓ Approve Payment"}
          </button>
          {!showRejectForm ? (
            <button
              disabled={busy}
              onClick={() => setShowRejectForm(true)}
              className="rounded-full border border-rose-500 px-4 py-2 text-xs font-bold uppercase tracking-wider text-rose-500 hover:bg-rose-500/10 transition-colors"
            >
              ✕ Reject Payment
            </button>
          ) : (
            <div className="flex w-full gap-2 mt-2">
              <input
                placeholder="Reason for rejection (e.g. Invalid UTR, wrong amount)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="flex-1 rounded-xl border border-line px-3 py-2 text-xs outline-none focus:border-rose-500"
              />
              <button
                disabled={busy}
                onClick={reject}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                Confirm Reject
              </button>
            </div>
          )}
        </div>
      )}

      {payment.status === "VERIFIED" && (
        <p className="mt-4 text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
          <span>✓</span> Payment verified — order confirmed and ready for dispatch.
        </p>
      )}

      {/* Full-Screen Zoom Lightbox Modal */}
      {isZoomOpen && payment.screenshotPath && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-200">
          <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
            <button
              onClick={() => setZoomScale((s) => Math.min(s + 0.3, 3))}
              className="p-2.5 rounded-full bg-white/20 text-white hover:bg-white/30 text-sm font-bold backdrop-blur-xs"
              title="Zoom In"
            >
              ➕
            </button>
            <button
              onClick={() => setZoomScale((s) => Math.max(s - 0.3, 0.5))}
              className="p-2.5 rounded-full bg-white/20 text-white hover:bg-white/30 text-sm font-bold backdrop-blur-xs"
              title="Zoom Out"
            >
              ➖
            </button>
            <button
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="p-2.5 rounded-full bg-white/20 text-white hover:bg-white/30 text-sm font-bold backdrop-blur-xs"
              title="Rotate 90°"
            >
              ⟳
            </button>
            <button
              onClick={handleDownloadScreenshot}
              className="px-3.5 py-2 rounded-full bg-[#FFBA00] text-[#0C3B2E] text-xs font-bold shadow-md hover:bg-[#EAA800]"
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
              className="p-2.5 rounded-full bg-rose-600 text-white hover:bg-rose-700 text-sm font-bold"
              title="Close"
            >
              ✕
            </button>
          </div>

          <div
            className="relative max-h-[88vh] max-w-[88vw] overflow-auto flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={payment.screenshotPath}
              alt="Full resolution payment screenshot"
              style={{
                transform: `scale(${zoomScale}) rotate(${rotation}deg)`,
                transition: "transform 0.2s ease-out",
                maxHeight: "85vh",
                maxWidth: "85vw",
                objectFit: "contain",
              }}
              className="rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-line pb-1.5 last:border-0">
      <span className="text-dim">{label}</span>
      <span className="font-semibold text-right">{value}</span>
    </div>
  );
}
