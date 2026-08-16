"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/providers/ToastProvider";

type Address = {
  id: string;
  fullName: string;
  mobileNumber: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  pinCode: string;
  landmark?: string | null;
  isDefault: boolean;
};

const emptyForm = {
  fullName: "",
  mobileNumber: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  pinCode: "",
  landmark: "",
  isDefault: false,
};

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { success, error: toastError } = useToast();

  async function load() {
    try {
      const res = await fetch("/api/addresses");
      if (res.ok) {
        const data = await res.json();
        setAddresses(data.addresses || []);
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const url = editingId ? `/api/addresses/${editingId}` : "/api/addresses";
      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      success("Address Saved", "Your delivery address has been updated.");
      setForm(emptyForm);
      setShowForm(false);
      setEditingId(null);
      load();
    } catch {
      toastError("Error", "Could not save address.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    await fetch(`/api/addresses/${id}`, { method: "DELETE" });
    success("Address Removed", "Address deleted from address book.");
    load();
  }

  async function makeDefault(id: string) {
    await fetch(`/api/addresses/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDefault: true }),
    });
    success("Default Address Set", "This address is now your primary delivery address.");
    load();
  }

  function edit(a: Address) {
    setForm({
      fullName: a.fullName,
      mobileNumber: a.mobileNumber,
      addressLine1: a.addressLine1,
      addressLine2: a.addressLine2 ?? "",
      city: a.city,
      state: a.state,
      pinCode: a.pinCode,
      landmark: a.landmark ?? "",
      isDefault: a.isDefault,
    });
    setEditingId(a.id);
    setShowForm(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold">Saved Addresses</h2>
          <p className="text-xs text-dim mt-0.5">Manage your shipping and billing locations.</p>
        </div>
        {!showForm && (
          <button
            onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true); }}
            className="px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider text-white shadow-sm"
            style={{ backgroundColor: "var(--fc-primary)" }}
          >
            + Add Address
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={save}
          className="p-6 rounded-2xl border space-y-4 animate-in fade-in duration-200"
          style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}
        >
          <h3 className="font-display text-lg font-bold">
            {editingId ? "Edit Address" : "Add New Address"}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Full Name *" value={form.fullName} onChange={(v) => setForm({ ...form, fullName: v })} required />
            <Input label="Mobile Phone Number *" value={form.mobileNumber} onChange={(v) => setForm({ ...form, mobileNumber: v })} required />
            <Input label="Address Line 1 *" value={form.addressLine1} onChange={(v) => setForm({ ...form, addressLine1: v })} required className="sm:col-span-2" />
            <Input label="Address Line 2 (Optional)" value={form.addressLine2} onChange={(v) => setForm({ ...form, addressLine2: v })} className="sm:col-span-2" />
            <Input label="City *" value={form.city} onChange={(v) => setForm({ ...form, city: v })} required />
            <Input label="State *" value={form.state} onChange={(v) => setForm({ ...form, state: v })} required />
            <Input label="PIN Code *" value={form.pinCode} onChange={(v) => setForm({ ...form, pinCode: v })} required />
            <Input label="Landmark (Optional)" value={form.landmark} onChange={(v) => setForm({ ...form, landmark: v })} />
          </div>

          <label className="flex items-center gap-2 pt-1 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
              className="rounded"
            />
            <span className="font-semibold text-dim">Set as default delivery address</span>
          </label>

          {error && <p className="text-xs text-rose-500 font-semibold">{error}</p>}

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl border text-xs text-dim hover:bg-black/5 dark:hover:bg-white/5"
              style={{ borderColor: "var(--fc-border)" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 rounded-xl font-bold text-xs uppercase tracking-wider text-white shadow-sm disabled:opacity-50"
              style={{ backgroundColor: "var(--fc-primary)" }}
            >
              {saving ? "Saving…" : "Save Address"}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {addresses.map((a) => (
          <div
            key={a.id}
            className="p-5 rounded-2xl border flex flex-col justify-between space-y-4 card-theme"
            style={{
              backgroundColor: "var(--fc-surface)",
              borderColor: a.isDefault ? "var(--fc-primary)" : "var(--fc-border)",
            }}
          >
            <div>
              <div className="flex items-center justify-between">
                <p className="font-bold text-sm">{a.fullName}</p>
                {a.isDefault && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20">
                    Default
                  </span>
                )}
              </div>
              <p className="text-xs text-dim mt-1">{a.mobileNumber}</p>
              <p className="text-xs text-muted mt-2 leading-relaxed">
                {a.addressLine1}{a.addressLine2 ? `, ${a.addressLine2}` : ""}<br />
                {a.city}, {a.state} - {a.pinCode}
                {a.landmark ? <><br /><span className="text-dim">Landmark: {a.landmark}</span></> : ""}
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t text-xs" style={{ borderColor: "var(--fc-border)" }}>
              <div className="flex items-center gap-3">
                <button onClick={() => edit(a)} className="font-bold text-primary hover:underline">
                  Edit
                </button>
                <button onClick={() => remove(a.id)} className="text-rose-500 hover:underline">
                  Delete
                </button>
              </div>

              {!a.isDefault && (
                <button onClick={() => makeDefault(a.id)} className="text-dim hover:text-primary transition-colors text-[11px]">
                  Set as Default
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  required,
  className,
}: {
  label: string;
  value?: string;
  onChange: (v: string) => void;
  required?: boolean;
  className?: string;
}) {
  return (
    <label className={`block text-xs ${className ?? ""}`}>
      <span className="font-bold text-dim uppercase mb-1 block">{label}</span>
      <input
        required={required}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none focus:border-primary"
        style={{
          backgroundColor: "var(--fc-bg)",
          borderColor: "var(--fc-border)",
        }}
      />
    </label>
  );
}
