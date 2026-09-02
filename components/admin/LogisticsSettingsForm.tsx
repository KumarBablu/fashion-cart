"use client";

import { useState } from "react";
import { useToast } from "@/components/providers/ToastProvider";

interface LogisticsSettingsFormProps {
  initialSettings?: any;
  initialPickup?: any;
}

export default function LogisticsSettingsForm({
  initialSettings,
  initialPickup,
}: LogisticsSettingsFormProps) {
  const { success, error: toastError } = useToast();
  const [saving, setSaving] = useState(false);

  const [provider, setProvider] = useState(initialSettings?.provider || "shiprocket");
  const [environment, setEnvironment] = useState(initialSettings?.environment || "sandbox");
  const [apiEmail, setApiEmail] = useState(initialSettings?.apiEmail || "");
  const [apiPassword, setApiPassword] = useState(initialSettings?.apiPassword || "");
  const [autoFulfill, setAutoFulfill] = useState(Boolean(initialSettings?.autoFulfillEnabled));
  const [garmentWeight, setGarmentWeight] = useState(initialSettings?.defaultGarmentWeight || "0.600");
  const [jewelWeight, setJewelWeight] = useState(initialSettings?.defaultJewelWeight || "0.150");

  // Pickup Hub info
  const [nickname, setNickname] = useState(initialPickup?.nickname || "Primary Logistics Dispatch Hub");
  const [contactPerson, setContactPerson] = useState(initialPickup?.contactPerson || "Fashion Cart Logistics");
  const [phone, setPhone] = useState(initialPickup?.phone || "9876543210");
  const [addressLine1, setAddressLine1] = useState(initialPickup?.addressLine1 || "Ring Road Textile Hub");
  const [city, setCity] = useState(initialPickup?.city || "Surat");
  const [state, setState] = useState(initialPickup?.state || "Gujarat");
  const [pinCode, setPinCode] = useState(initialPickup?.pinCode || "395002");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/logistics/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          environment,
          apiEmail,
          apiPassword,
          autoFulfillEnabled: autoFulfill,
          defaultGarmentWeight: Number(garmentWeight),
          defaultJewelWeight: Number(jewelWeight),
          pickupLocation: {
            nickname,
            contactPerson,
            phone,
            addressLine1,
            city,
            state,
            pinCode,
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        success("Settings Saved", "Logistics & dispatch hub settings updated.");
      } else {
        toastError("Error", data.error || "Failed to update settings");
      }
    } catch {
      toastError("Error", "Network communication failure");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSave}
      className="p-6 rounded-3xl border space-y-6"
      style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4" style={{ borderColor: "var(--fc-border)" }}>
        <div>
          <h3 className="font-display text-base font-bold flex items-center gap-2">
            <span>🚚</span> Courier &amp; Logistics Hub Configuration
          </h3>
          <p className="text-xs text-dim mt-0.5">
            Connect Shiprocket, set up doorstep pickup address, and configure default parcel weights.
          </p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2 rounded-full text-xs font-bold text-white shadow-xs hover:opacity-90 disabled:opacity-50 cursor-pointer"
          style={{ backgroundColor: "var(--fc-primary)" }}
        >
          {saving ? "Saving…" : "Save Logistics Settings"}
        </button>
      </div>

      {/* Provider & Environment */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold text-dim uppercase mb-1">Provider Engine</label>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:border-primary"
            style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}
          >
            <option value="shiprocket">Shiprocket (17+ Couriers Aggregator)</option>
            <option value="manual">Manual / In-House Courier Only</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-dim uppercase mb-1">Environment Mode</label>
          <select
            value={environment}
            onChange={(e) => setEnvironment(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:border-primary"
            style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}
          >
            <option value="sandbox">Sandbox / Simulation (Test Mode)</option>
            <option value="production">Production (Live Shipments)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-dim uppercase mb-1">Fulfillment Mode</label>
          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="autoFulfill"
              checked={autoFulfill}
              onChange={(e) => setAutoFulfill(e.target.checked)}
              className="h-4 w-4 rounded accent-primary cursor-pointer"
            />
            <label htmlFor="autoFulfill" className="text-xs font-medium cursor-pointer">
              Full Auto-Pilot (Auto-book on confirm)
            </label>
          </div>
        </div>
      </div>

      {/* Shiprocket Credentials */}
      {provider === "shiprocket" && (
        <div className="p-4 rounded-2xl border space-y-3 bg-slate-500/5" style={{ borderColor: "var(--fc-border)" }}>
          <span className="text-xs font-bold text-dim uppercase block">Shiprocket API Credentials</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-dim uppercase mb-1">Account Email</label>
              <input
                type="email"
                value={apiEmail}
                onChange={(e) => setApiEmail(e.target.value)}
                placeholder="shiprocket-account@yourdomain.com"
                className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:border-primary"
                style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-dim uppercase mb-1">Account Password</label>
              <input
                type="password"
                value={apiPassword}
                onChange={(e) => setApiPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:border-primary"
                style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}
              />
            </div>
          </div>
          <p className="text-[11px] text-dim">
            Note: In Sandbox mode, mock rates and AWBs are generated automatically if credentials are empty.
          </p>
        </div>
      )}

      {/* Doorstep Pickup Hub Address */}
      <div className="space-y-3">
        <span className="text-xs font-bold text-dim uppercase block">Doorstep Courier Pickup Hub (Sender Address)</span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-dim uppercase mb-1">Hub Nickname</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g. Surat Main Warehouse"
              className="w-full px-3 py-1.5 rounded-xl border text-xs outline-none focus:border-primary"
              style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-dim uppercase mb-1">Contact Person</label>
            <input
              type="text"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              placeholder="e.g. Bablu Kumar"
              className="w-full px-3 py-1.5 rounded-xl border text-xs outline-none focus:border-primary"
              style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-dim uppercase mb-1">Contact Phone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 9876543210"
              className="w-full px-3 py-1.5 rounded-xl border text-xs outline-none focus:border-primary"
              style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-dim uppercase mb-1">Street Address</label>
            <input
              type="text"
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              placeholder="Warehouse / Office building"
              className="w-full px-3 py-1.5 rounded-xl border text-xs outline-none focus:border-primary"
              style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-dim uppercase mb-1">City / State</label>
            <input
              type="text"
              value={`${city}, ${state}`}
              onChange={(e) => {
                const parts = e.target.value.split(",");
                setCity(parts[0]?.trim() || "");
                if (parts[1]) setState(parts[1]?.trim());
              }}
              placeholder="Surat, Gujarat"
              className="w-full px-3 py-1.5 rounded-xl border text-xs outline-none focus:border-primary"
              style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-dim uppercase mb-1">Pickup PIN Code</label>
            <input
              type="text"
              value={pinCode}
              onChange={(e) => setPinCode(e.target.value)}
              placeholder="395002"
              className="w-full px-3 py-1.5 rounded-xl border text-xs font-mono font-bold outline-none focus:border-primary"
              style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}
            />
          </div>
        </div>
      </div>

      {/* Default Item Package Weights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t" style={{ borderColor: "var(--fc-border)" }}>
        <div>
          <label className="block text-xs font-bold text-dim uppercase mb-1">Default Garment Weight (kg)</label>
          <input
            type="number"
            step="0.05"
            value={garmentWeight}
            onChange={(e) => setGarmentWeight(e.target.value)}
            className="w-full px-3 py-1.5 rounded-xl border text-xs outline-none focus:border-primary"
            style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}
          />
          <span className="text-[10px] text-dim mt-0.5 block">Standard folded apparel parcel ~0.600 kg</span>
        </div>
        <div>
          <label className="block text-xs font-bold text-dim uppercase mb-1">Default Jewellery Weight (kg)</label>
          <input
            type="number"
            step="0.05"
            value={jewelWeight}
            onChange={(e) => setJewelWeight(e.target.value)}
            className="w-full px-3 py-1.5 rounded-xl border text-xs outline-none focus:border-primary"
            style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}
          />
          <span className="text-[10px] text-dim mt-0.5 block">Padded jewellery box parcel ~0.150 kg</span>
        </div>
      </div>
    </form>
  );
}
