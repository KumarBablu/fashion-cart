"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useToast } from "@/components/providers/ToastProvider";

export default function PaymentSettingsForm({
  initial,
}: {
  initial: {
    qrCodePath: string | null;
    upiId: string;
    payeeName?: string | null;
    instructions: string;
    manualUpiEnabled?: boolean;
    codEnabled?: boolean;
    codFee?: number;
  };
}) {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [manualUpiEnabled, setManualUpiEnabled] = useState(initial.manualUpiEnabled ?? true);
  const [upiId, setUpiId] = useState(initial.upiId);
  const [payeeName, setPayeeName] = useState(initial.payeeName || "Bablu Kumar");
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
    formData.append("manualUpiEnabled", String(manualUpiEnabled));
    formData.append("upiId", upiId);
    formData.append("payeeName", payeeName);
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
      success(
        "Payment Settings Saved",
        `Manual UPI is now ${manualUpiEnabled ? "Active & Visible" : "Deactivated & Hidden"} on checkout.`
      );
      router.refresh();
    } catch (e) {
      const msg = (e as Error)?.message || "Network request failed.";
      setError(msg);
      toastError("Error", msg);
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-6 rounded-3xl border p-6 card-theme bg-white dark:bg-neutral-900 shadow-xs" style={{ borderColor: "var(--fc-border)" }}>
      {/* 1. MASTER TOGGLE: Manual UPI QR Payment Method */}
      <div
        className={`p-5 rounded-2xl border transition-all duration-200 ${
          manualUpiEnabled
            ? "bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800"
            : "bg-neutral-50 dark:bg-neutral-800/40 border-neutral-300 dark:border-neutral-700"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xl">📲</span>
              <h3 className="text-sm font-bold text-[#141416] dark:text-white">
                Manual UPI QR &amp; Screenshot Payment
              </h3>
              <span
                className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                  manualUpiEnabled
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-300"
                    : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300"
                }`}
              >
                {manualUpiEnabled ? "✓ Active (Visible at Checkout)" : "✕ Deactivated (Hidden from Users)"}
              </span>
            </div>
            <p className="text-xs text-dim leading-relaxed max-w-2xl">
              Turn this <strong>ON</strong> to allow customers to scan your boutique UPI QR code and upload payment proof. Turn this <strong>OFF</strong> to completely hide manual payment from the checkout screen so customers can only use <strong>Instant Online Payment (Razorpay)</strong> and Cash on Delivery.
            </p>
          </div>

          {/* Toggle Switch */}
          <label className="relative inline-flex items-center cursor-pointer shrink-0 self-start sm:self-center">
            <input
              type="checkbox"
              checked={manualUpiEnabled}
              onChange={(e) => setManualUpiEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-13 h-7 bg-gray-300 dark:bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5.5 after:w-5.5 after:transition-all peer-checked:bg-[#0C3B2E] dark:peer-checked:bg-emerald-600 shadow-inner"></div>
          </label>
        </div>

        {!manualUpiEnabled && (
          <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700/60 flex items-center gap-2 text-xs font-semibold text-rose-700 dark:text-rose-400">
            <span>⚠️</span>
            <span>Manual UPI is currently hidden from customers. Only Razorpay and COD will be shown at checkout.</span>
          </div>
        )}
      </div>

      {/* 2. QR Code & Receiver Settings (Collapsible or visually connected to the toggle) */}
      <div className={`space-y-4 transition-opacity duration-200 ${!manualUpiEnabled ? "opacity-60" : ""}`}>
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wide text-dim">Active Boutique UPI QR Code</span>
            {!manualUpiEnabled && (
              <span className="text-[10px] font-bold text-dim uppercase tracking-wider bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded">
                Hidden from Checkout
              </span>
            )}
          </div>
          <div className="relative h-48 w-48 rounded-2xl border overflow-hidden p-2 bg-[#FAF8F5] dark:bg-neutral-800 shadow-2xs" style={{ borderColor: "var(--fc-border)" }}>
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
            <span className="text-[10px] font-bold text-[#C59B27] bg-[#FBF4E2] dark:bg-amber-950/60 dark:text-amber-300 px-2 py-0.5 rounded-full">Funds credit directly to this account</span>
          </div>
          <input
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            placeholder="e.g. 9771039201@upi, merchant@icici, yourcompany@okaxis"
            className="mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-xs font-mono font-bold outline-none focus:border-[#C59B27] bg-[#FAF8F5] dark:bg-neutral-800"
            style={{ borderColor: "var(--fc-border)" }}
          />
          <span className="text-[11px] text-dim block mt-1 leading-relaxed">
            💡 Enter your official UPI ID (e.g. <strong>9771039201@upi</strong>). 100% of customer payments are deposited directly into this account with <strong>0% middleman fees</strong>.
          </span>
        </label>

        <label className="block">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wide text-dim">Receiver Bank Account Name / Payee Name</span>
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">NPCI Name Verification</span>
          </div>
          <input
            value={payeeName}
            onChange={(e) => setPayeeName(e.target.value)}
            placeholder="e.g. Bablu Kumar (Name registered on bank account/BHIM)"
            className="mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-xs font-bold outline-none focus:border-[#C59B27] bg-[#FAF8F5] dark:bg-neutral-800"
            style={{ borderColor: "var(--fc-border)" }}
          />
          <span className="text-[11px] text-dim block mt-1 leading-relaxed">
            Must match the registered bank account name for this UPI ID (e.g. <strong>Bablu Kumar</strong>) to ensure Google Pay and PhonePe pass NPCI payee verification without mismatch errors.
          </span>
        </label>

        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wide text-dim">Payment Instructions for Customer</span>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-xl border px-3.5 py-2 text-xs outline-none focus:border-[#C59B27] bg-[#FAF8F5] dark:bg-neutral-800"
            style={{ borderColor: "var(--fc-border)" }}
          />
        </label>
      </div>

      {/* 3. Cash on Delivery (COD) Configuration */}
      <div className="p-5 rounded-2xl border space-y-3 bg-[#FAF8F5] dark:bg-neutral-800/40" style={{ borderColor: "var(--fc-border)" }}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-[#141416] dark:text-white">Cash on Delivery (COD)</p>
            <p className="text-[11px] text-dim">Allow customers to pay upon package delivery</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={codEnabled}
              onChange={(e) => setCodEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-300 dark:bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#141416] dark:peer-checked:bg-white"></div>
          </label>
        </div>

        {codEnabled && (
          <label className="block pt-2 border-t border-neutral-200 dark:border-neutral-700">
            <span className="text-xs font-bold uppercase tracking-wide text-dim">Extra COD Handling Fee (₹)</span>
            <input
              type="number"
              min="0"
              value={codFee}
              onChange={(e) => setCodFee(e.target.value)}
              className="mt-1 w-32 rounded-xl border px-3.5 py-2 text-xs font-bold outline-none focus:border-[#C59B27] bg-white dark:bg-neutral-900"
              style={{ borderColor: "var(--fc-border)" }}
            />
          </label>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-[#141416] text-white px-8 py-3 text-xs font-bold uppercase tracking-wider hover:bg-[#25262B] transition-all cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-2"
      >
        {saving && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
        <span>{saving ? "Saving Changes…" : "Save Payment Settings"}</span>
      </button>
    </form>
  );
}
