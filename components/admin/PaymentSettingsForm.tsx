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
      const data = await res.json().catch(() => ({ error: "Server response error" }));
      setSaving(false);

      if (!res.ok) {
        const msg = data.error || "Failed to update payment settings";
        setError(msg);
        toastError("Save Failed", msg);
        return;
      }
      success("Payment Settings Saved", "Updated UPI QR code and payment options.");
      router.refresh();
    } catch (e) {
      const msg = (e as Error)?.message || "Network request failed.";
      setError(msg);
      toastError("Error", msg);
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-4 rounded-2xl border p-6 card-theme bg-white shadow-xs" style={{ borderColor: "var(--fc-border)" }}>
      <div>
        <span className="text-xs font-bold uppercase tracking-wide text-dim">Active UPI QR Code</span>
        <div className="mt-2 relative h-48 w-48 rounded-2xl border overflow-hidden p-2 bg-[#FAF8F5] shadow-2xs" style={{ borderColor: "var(--fc-border)" }}>
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
          className="mt-1 block text-xs file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#141416] file:text-white hover:file:bg-[#25262B] file:cursor-pointer"
        />
        <span className="text-[10px] text-dim block mt-1">Supports PNG, JPG, JPEG, and WebP (up to 5MB)</span>
      </label>

      <label className="block">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wide text-dim">Company / Shop Receiver UPI ID</span>
          <span className="text-[10px] font-bold text-[#C59B27] bg-[#FBF4E2] px-2 py-0.5 rounded-full">Funds credit directly to this account</span>
        </div>
        <input
          value={upiId}
          onChange={(e) => setUpiId(e.target.value)}
          placeholder="e.g. yourcompany@okaxis, merchant@icici, 9876543210@paytm"
          className="mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-xs font-mono font-bold outline-none focus:border-[#C59B27] bg-[#FAF8F5]"
          style={{ borderColor: "var(--fc-border)" }}
        />
        <span className="text-[11px] text-dim block mt-1 leading-relaxed">
          💡 Enter your company&apos;s official Business/Current Bank Account UPI ID (e.g. <strong>Google Pay Business, PhonePe Merchant, Paytm Merchant, or Bank VPA</strong>). When customers scan the Dynamic Amount-Locked QR code at checkout, 100% of their payment is instantly deposited directly into the bank account linked with this UPI ID with <strong>0% middleman fees</strong>.
        </span>
      </label>

      <div className="p-4 rounded-xl border space-y-3 bg-[#FAF8F5]" style={{ borderColor: "var(--fc-border)" }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[#141416]">Cash on Delivery (COD)</p>
            <p className="text-[11px] text-dim">Allow customers to pay upon package delivery</p>
          </div>
          <input
            type="checkbox"
            checked={codEnabled}
            onChange={(e) => setCodEnabled(e.target.checked)}
            className="h-4 w-4 rounded accent-[#141416]"
          />
        </div>

        {codEnabled && (
          <label className="block pt-2 border-t" style={{ borderColor: "var(--fc-border)" }}>
            <span className="text-xs font-bold uppercase tracking-wide text-dim">Extra COD Handling Fee (₹)</span>
            <input
              type="number"
              min="0"
              value={codFee}
              onChange={(e) => setCodFee(e.target.value)}
              className="mt-1 w-32 rounded-xl border px-3.5 py-2 text-xs font-bold outline-none focus:border-[#C59B27] bg-white"
              style={{ borderColor: "var(--fc-border)" }}
            />
          </label>
        )}
      </div>

      <label className="block">
        <span className="text-xs font-bold uppercase tracking-wide text-dim">Payment Instructions for Customer</span>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-xl border px-3.5 py-2 text-xs outline-none focus:border-[#C59B27] bg-[#FAF8F5]"
          style={{ borderColor: "var(--fc-border)" }}
        />
      </label>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-[#141416] text-white px-6 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-[#25262B] transition-all cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-2"
      >
        {saving && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
        <span>{saving ? "Saving Changes…" : "Save Payment Settings"}</span>
      </button>
    </form>
  );
}
