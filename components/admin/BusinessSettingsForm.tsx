"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Initial = {
  businessName: string;
  businessAddress: string;
  gstin: string;
  phone: string;
  email: string;
};

export default function BusinessSettingsForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    const res = await fetch("/api/admin/settings/business", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={save} className="space-y-4 rounded-lg border border-line bg-white p-5">
      <Field label="Business Name">
        <input value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} className="w-full rounded-md border border-line px-3 py-2 text-sm" />
      </Field>
      <Field label="Business Address">
        <textarea value={form.businessAddress} onChange={(e) => setForm({ ...form, businessAddress: e.target.value })} rows={2} className="w-full rounded-md border border-line px-3 py-2 text-sm" />
      </Field>
      <Field label="GSTIN">
        <input value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value })} className="w-full rounded-md border border-line px-3 py-2 text-sm" />
      </Field>
      <Field label="Phone">
        <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-md border border-line px-3 py-2 text-sm" />
      </Field>
      <Field label="Email">
        <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-md border border-line px-3 py-2 text-sm" />
      </Field>
      {error && <p className="text-sm text-fc-red">{error}</p>}
      {saved && <p className="text-sm text-emerald-700">Saved.</p>}
      <button disabled={saving} className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
        {saving ? "Saving…" : "Save"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
