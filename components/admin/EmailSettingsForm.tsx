"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/providers/ToastProvider";

type EmailSettings = {
  smtpHost: string | null;
  smtpPort: number | null;
  smtpUser: string | null;
  smtpPassword?: string | null;
  smtpSecure: boolean;
  fromEmail: string;
  fromName: string;
  notifyAdminEmail: string | null;
};

export default function EmailSettingsForm({ initial }: { initial?: EmailSettings | null }) {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [smtpHost, setSmtpHost] = useState(initial?.smtpHost || "");
  const [smtpPort, setSmtpPort] = useState(String(initial?.smtpPort || 587));
  const [smtpUser, setSmtpUser] = useState(initial?.smtpUser || "");
  const [smtpPassword, setSmtpPassword] = useState(initial?.smtpPassword || "");
  const [smtpSecure, setSmtpSecure] = useState(initial?.smtpSecure || false);
  const [fromEmail, setFromEmail] = useState(initial?.fromEmail || "notifications@fashioncart.shop");
  const [fromName, setFromName] = useState(initial?.fromName || "Fashion Cart");
  const [notifyAdminEmail, setNotifyAdminEmail] = useState(initial?.notifyAdminEmail || "");

  const [testEmail, setTestEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/settings/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          smtpHost: smtpHost.trim() || undefined,
          smtpPort: smtpPort ? parseInt(smtpPort, 10) : 587,
          smtpUser: smtpUser.trim() || undefined,
          smtpPassword: smtpPassword.trim() || undefined,
          smtpSecure,
          fromEmail: fromEmail.trim(),
          fromName: fromName.trim(),
          notifyAdminEmail: notifyAdminEmail.trim() || undefined,
        }),
      });

      const data = await res.json();
      setSaving(false);

      if (!res.ok) {
        setError(data.error || "Failed to save email settings.");
        return;
      }

      success("Email Settings Saved! ✉️", "Updated transactional email configuration.");
      router.refresh();
    } catch {
      setError("Network error.");
      setSaving(false);
    }
  }

  async function handleSendTest() {
    if (!testEmail.trim()) {
      setError("Please enter an email address to send the test message to.");
      return;
    }

    setTesting(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/settings/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          smtpHost: smtpHost.trim() || undefined,
          smtpPort: smtpPort ? parseInt(smtpPort, 10) : 587,
          smtpUser: smtpUser.trim() || undefined,
          smtpPassword: smtpPassword.trim() || undefined,
          smtpSecure,
          fromEmail: fromEmail.trim(),
          fromName: fromName.trim(),
          notifyAdminEmail: notifyAdminEmail.trim() || undefined,
          sendTestTo: testEmail.trim(),
        }),
      });

      const data = await res.json();
      setTesting(false);

      if (!res.ok) {
        setError(data.error || "Test email failed.");
        return;
      }

      if (data.testResult?.success) {
        success(
          data.testResult.simulated ? "Test Email Simulated" : "Test Email Sent! 🚀",
          data.testResult.simulated
            ? "Email logged to Audit Logs (no live SMTP configured yet)."
            : `Delivered test message to ${testEmail.trim()}`
        );
      } else {
        toastError("Email Delivery Error", data.testResult?.error || "Unable to deliver message.");
      }
    } catch {
      toastError("Error", "Network request failed.");
      setTesting(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="p-6 rounded-2xl border space-y-5" style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase text-dim mb-1">From Sender Name</label>
          <input
            type="text"
            required
            value={fromName}
            onChange={(e) => setFromName(e.target.value)}
            placeholder="e.g. Fashion Cart"
            className="w-full px-3.5 py-2 rounded-xl border text-xs outline-none focus:border-primary"
            style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-dim mb-1">From Sender Email</label>
          <input
            type="email"
            required
            value={fromEmail}
            onChange={(e) => setFromEmail(e.target.value)}
            placeholder="notifications@fashioncart.shop"
            className="w-full px-3.5 py-2 rounded-xl border text-xs outline-none focus:border-primary"
            style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-dim mb-1">Admin Notification Email</label>
          <input
            type="email"
            value={notifyAdminEmail}
            onChange={(e) => setNotifyAdminEmail(e.target.value)}
            placeholder="admin@fashioncart.shop"
            className="w-full px-3.5 py-2 rounded-xl border text-xs outline-none focus:border-primary"
            style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-dim mb-1">SMTP Host Server</label>
          <input
            type="text"
            value={smtpHost}
            onChange={(e) => setSmtpHost(e.target.value)}
            placeholder="smtp.gmail.com / smtp.brevo.com"
            className="w-full px-3.5 py-2 rounded-xl border text-xs outline-none focus:border-primary"
            style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-dim mb-1">SMTP Port</label>
          <input
            type="number"
            value={smtpPort}
            onChange={(e) => setSmtpPort(e.target.value)}
            placeholder="587 (TLS) or 465 (SSL)"
            className="w-full px-3.5 py-2 rounded-xl border text-xs outline-none focus:border-primary"
            style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-dim mb-1">SMTP Username / Email</label>
          <input
            type="text"
            value={smtpUser}
            onChange={(e) => setSmtpUser(e.target.value)}
            placeholder="your-smtp-username"
            className="w-full px-3.5 py-2 rounded-xl border text-xs outline-none focus:border-primary"
            style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-bold uppercase text-dim mb-1">SMTP Password / App Key</label>
          <input
            type="password"
            value={smtpPassword}
            onChange={(e) => setSmtpPassword(e.target.value)}
            placeholder="••••••••••••••••"
            className="w-full px-3.5 py-2 rounded-xl border text-xs outline-none focus:border-primary"
            style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}
          />
          <p className="text-[11px] text-dim mt-1">
            Note: If left unconfigured, Fashion Cart automatically operates in resilient local simulation &amp; logging mode without interrupting customer workflows.
          </p>
        </div>
      </div>

      <label className="flex items-center gap-2 text-xs cursor-pointer pt-1">
        <input
          type="checkbox"
          checked={smtpSecure}
          onChange={(e) => setSmtpSecure(e.target.checked)}
          className="rounded"
        />
        <span className="font-semibold text-dim">Use SSL / Secure Connection (Port 465)</span>
      </label>

      {error && <p className="text-xs text-rose-500 font-semibold">{error}</p>}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t" style={{ borderColor: "var(--fc-border)" }}>
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider text-white shadow-sm disabled:opacity-50"
          style={{ backgroundColor: "var(--fc-primary)" }}
        >
          {saving ? "Saving…" : "Save Email Settings"}
        </button>

        {/* Test Email Section */}
        <div className="flex items-center gap-2">
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="Enter test recipient email"
            className="px-3 py-1.5 rounded-xl border text-xs outline-none focus:border-primary w-48 sm:w-56"
            style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}
          />
          <button
            type="button"
            disabled={testing}
            onClick={handleSendTest}
            className="px-4 py-2 rounded-xl border text-xs font-bold uppercase hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
            style={{ borderColor: "var(--fc-border)" }}
          >
            {testing ? "Sending…" : "Send Test 🚀"}
          </button>
        </div>
      </div>
    </form>
  );
}
