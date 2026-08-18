"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/providers/ToastProvider";

type Initial = {
  businessName: string;
  businessAddress: string;
  gstin: string;
  phone: string;
  email: string;
};

export default function BusinessSettingsForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/settings/business", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({ error: "Server response error" }));
      setSaving(false);

      if (!res.ok) {
        const msg = data.error || "Failed to update business settings";
        setError(msg);
        toastError("Save Failed", msg);
        return;
      }
      success("Business Details Saved", "Updated business details and invoice information.");
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Registered Legal / Business Name" hint="Printed on the top of invoices">
          <input
            value={form.businessName}
            onChange={(e) => setForm({ ...form, businessName: e.target.value })}
            placeholder="Fashion Cart Luxury Atelier Private Limited"
            className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-[#C59B27] bg-[#FAF8F5]"
            style={{ borderColor: "var(--fc-border)" }}
          />
        </Field>

        <Field label="GSTIN (Tax Identification Number)" hint="15-digit GST identification number">
          <input
            value={form.gstin}
            onChange={(e) => setForm({ ...form, gstin: e.target.value })}
            placeholder="27AAACF1234F1Z5"
            className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-xs font-mono font-bold outline-none focus:border-[#C59B27] bg-[#FAF8F5]"
            style={{ borderColor: "var(--fc-border)" }}
          />
        </Field>
      </div>

      <Field label="Official Registered Business Address" hint="Full office/store address printed on invoices">
        <textarea
          value={form.businessAddress}
          onChange={(e) => setForm({ ...form, businessAddress: e.target.value })}
          rows={2}
          placeholder="Plot 42, Fashion Boulevard, DLF CyberCity, Gurugram, Haryana 122002"
          className="mt-1 w-full rounded-xl border px-3.5 py-2 text-xs outline-none focus:border-[#C59B27] bg-[#FAF8F5]"
          style={{ borderColor: "var(--fc-border)" }}
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Official Support Phone Number">
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+91 98765 43210"
            className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-[#C59B27] bg-[#FAF8F5]"
            style={{ borderColor: "var(--fc-border)" }}
          />
        </Field>

        <Field label="Official Billing & Communication Email">
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="fashioncart.support@gmail.com"
            className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-[#C59B27] bg-[#FAF8F5]"
            style={{ borderColor: "var(--fc-border)" }}
          />
        </Field>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
          {error}
        </div>
      )}

      <div className="pt-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-[#141416] text-white px-6 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-[#25262B] transition-all cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-2"
        >
          {saving && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          <span>{saving ? "Saving Changes…" : "Save Business Information"}</span>
        </button>
      </div>
    </form>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-bold uppercase tracking-wide text-dim">{label}</span>
        {hint && <span className="text-[10px] text-dim">{hint}</span>}
      </div>
      <div>{children}</div>
    </label>
  );
}
