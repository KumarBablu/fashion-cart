"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useToast } from "@/components/providers/ToastProvider";

export default function PaymentSettingsForm({
  initial,
}: {
  initial: { qrCodePath: string | null; upiId: string; instructions: string; codEnabled?: boolean; codFee?: number };
}) {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [upiId, setUpiId] = useState(initial.upiId);
  const [instructions, setInstructions] = useState(initial.instructions);
  const [codEnabled, setCodEnabled] = useState(initial.codEnabled ?? true);
  const [codFee, setCodFee] = useState(String(initial.codFee ?? 0));
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(initial.qrCodePath);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const formData = new FormData();
    if (file) formData.append("qrCode", file);
    formData.append("upiId", upiId);
    formData.append("instructions", instructions);
    formData.append("codEnabled", String(codEnabled));
    formData.append("codFee", codFee);

    try {
      const res = await fetch("/api/admin/settings/payment", { method: "POST", body: formData });
      const data = await res.json();
      setSaving(false);

      if (!res.ok) {
        setError(data.error);
        return;
      }
      success("Payment Settings Saved", "Updated UPI QR and payment preferences.");
      router.refresh();
    } catch {
      toastError("Error", "Network request failed.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-4 rounded-2xl border p-6" style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}>
      <div>
        <span className="text-xs font-bold uppercase tracking-wide text-dim">Active UPI QR Code</span>
        <div className="mt-2 relative h-44 w-44 rounded-xl border overflow-hidden p-2 bg-white" style={{ borderColor: "var(--fc-border)" }}>
          {preview ? (
            <Image src={preview} alt="Payment QR" fill className="object-contain p-2" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-dim text-center">No QR uploaded</div>
          )}
        </div>
      </div>

      <label className="block">
        <span className="text-xs font-bold uppercase tracking-wide text-dim">Upload New QR Code Image</span>
        <input
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            setFile(f);
            if (f) setPreview(URL.createObjectURL(f));
          }}
          className="mt-1 block text-xs file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-black/10 dark:file:bg-white/10 file:text-inherit"
        />
      </label>

      <label className="block">
        <span className="text-xs font-bold uppercase tracking-wide text-dim">Shop UPI ID (e.g. yourshop@okaxis)</span>
        <input
          value={upiId}
          onChange={(e) => setUpiId(e.target.value)}
          className="mt-1 w-full rounded-xl border px-3.5 py-2 text-xs font-mono font-bold outline-none focus:border-primary"
          style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}
        />
      </label>

      <div className="p-4 rounded-xl border space-y-3" style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold">Cash on Delivery (COD)</p>
            <p className="text-[11px] text-dim">Allow customers to pay upon package delivery</p>
          </div>
          <input
            type="checkbox"
            checked={codEnabled}
            onChange={(e) => setCodEnabled(e.target.checked)}
            className="h-4 w-4 rounded"
          />
        </div>

        {codEnabled && (
          <div>
            <span className="text-[11px] font-bold text-dim uppercase">Extra COD Handling Fee (₹)</span>
            <input
              type="number"
              min={0}
              value={codFee}
              onChange={(e) => setCodFee(e.target.value)}
              className="mt-1 w-32 rounded-lg border px-3 py-1.5 text-xs outline-none focus:border-primary"
              style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}
            />
          </div>
        )}
      </div>

      <label className="block">
        <span className="text-xs font-bold uppercase tracking-wide text-dim">Payment Instructions for Customer</span>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-xl border px-3.5 py-2 text-xs outline-none focus:border-primary"
          style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}
        />
      </label>

      {error && <p className="text-xs text-rose-500 font-semibold">{error}</p>}

      <button
        disabled={saving}
        className="rounded-full px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm disabled:opacity-50"
        style={{ backgroundColor: "var(--fc-primary)" }}
      >
        {saving ? "Saving…" : "Save Payment Settings"}
      </button>
    </form>
  );
}
