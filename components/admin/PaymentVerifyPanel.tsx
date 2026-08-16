"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { formatINR } from "@/lib/format";

type Payment = {
  id: string;
  status: string;
  amount: number;
  utrNumber: string | null;
  screenshotPath: string | null;
  submittedAt: string | null;
  rejectionReason: string | null;
};

export default function PaymentVerifyPanel({ payment }: { payment: Payment }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="mt-3">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="text-sm space-y-1.5">
          <Row label="Amount" value={formatINR(payment.amount)} />
          <Row label="UTR" value={payment.utrNumber ?? "—"} />
          <Row label="Status" value={payment.status.replace(/_/g, " ")} />
          <Row label="Submitted" value={payment.submittedAt ? new Date(payment.submittedAt).toLocaleString("en-IN") : "—"} />
          {payment.rejectionReason && <Row label="Rejection reason" value={payment.rejectionReason} />}
        </div>
        <div>
          {payment.screenshotPath ? (
            <a href={payment.screenshotPath} target="_blank" rel="noreferrer" className="block relative aspect-[9/16] max-h-64 overflow-hidden rounded-md border border-line">
              <Image src={payment.screenshotPath} alt="Payment screenshot" fill className="object-contain bg-ivory-deep" />
            </a>
          ) : (
            <p className="text-sm text-ink-soft">No screenshot submitted yet.</p>
          )}
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-fc-red">{error}</p>}

      {payment.status === "UNDER_REVIEW" && (
        <div className="mt-4 flex flex-wrap gap-3">
          <button disabled={busy} onClick={approve} className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">
            Approve Payment
          </button>
          {!showRejectForm ? (
            <button disabled={busy} onClick={() => setShowRejectForm(true)} className="rounded-full border border-fc-red px-5 py-2 text-sm font-semibold text-fc-red">
              Reject Payment
            </button>
          ) : (
            <div className="flex w-full gap-2 mt-2">
              <input
                placeholder="Rejection reason (optional)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="flex-1 rounded-md border border-line px-3 py-2 text-sm"
              />
              <button disabled={busy} onClick={reject} className="rounded-full bg-fc-red px-4 py-2 text-sm font-semibold text-white">
                Confirm Reject
              </button>
            </div>
          )}
        </div>
      )}

      {payment.status === "VERIFIED" && (
        <p className="mt-4 text-sm font-medium text-emerald-700">✓ Payment verified — order confirmed.</p>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-line pb-1.5 last:border-0">
      <span className="text-ink-soft">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
