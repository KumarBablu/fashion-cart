"use client";

import { useState } from "react";
import Link from "next/link";
import AuthCard from "@/components/AuthCard";
import { useToast } from "@/components/providers/ToastProvider";

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    success: boolean;
    resetUrl?: string;
    token?: string;
    recoveryCode?: string;
    emailMasked?: string;
  } | null>(null);

  const { success } = useToast();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!identifier.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim() }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error || "Could not process request.");
        return;
      }

      setResult(data);
      success("Account Located", "Password recovery details have been prepared.");
    } catch {
      setError("Network error while trying to retrieve account.");
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Retrieve Account"
      subtitle="Enter your registered email address or phone number to reset your password"
    >
      {!result ? (
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-dim mb-1">
              Email or Mobile Number
            </label>
            <input
              type="text"
              required
              autoFocus
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. asha@example.com or 9876543210"
              className="w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none focus:border-primary transition-all"
              style={{
                backgroundColor: "var(--fc-bg)",
                borderColor: "var(--fc-border)",
              }}
            />
          </div>

          {error && <p className="text-xs text-rose-500 font-semibold">{error}</p>}

          <button
            type="submit"
            disabled={loading || !identifier.trim()}
            className="w-full py-3.5 rounded-full font-bold text-xs uppercase tracking-wider text-white shadow-lg transition-all hover:brightness-105 disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ backgroundColor: "var(--fc-primary)" }}
          >
            {loading ? "Searching Account…" : "Find Account & Send Reset →"}
          </button>

          <div className="pt-2 text-center">
            <Link href="/login" className="text-xs text-dim hover:text-primary transition-colors">
              ← Remember your password? Login
            </Link>
          </div>
        </form>
      ) : (
        <div className="space-y-5 animate-in fade-in duration-300 text-center">
          <div
            className="p-5 rounded-2xl border space-y-3 text-center"
            style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}
          >
            <div className="text-4xl">✉️</div>
            <h3 className="font-display text-base font-bold text-primary">Check Your Email Inbox</h3>
            <p className="text-xs text-dim leading-relaxed">
              If an account is associated with <strong style={{ color: "var(--fc-text)" }}>{identifier}</strong>, we have dispatched a secure password recovery link to the registered email address.
            </p>
            <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/30 text-left text-[11px] text-emerald-800 dark:text-emerald-300 space-y-1">
              <p className="font-bold flex items-center gap-1">
                <span>🔒</span> Security Protocol:
              </p>
              <p>
                For your account safety, password resets can only be completed by clicking the unique verification link sent to your registered inbox.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 pt-2">
            <Link
              href="/login"
              className="w-full py-3.5 rounded-full font-bold text-xs uppercase tracking-wider text-white shadow-md transition-all hover:brightness-105"
              style={{ backgroundColor: "var(--fc-primary)" }}
            >
              Return to Login →
            </Link>

            <a
              href={`https://wa.me/919771039201?text=${encodeURIComponent(
                `Namaste Fashion Cart Support! I need assistance recovering my account with email/phone: ${identifier}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 rounded-full font-bold text-xs uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center justify-center gap-1.5 transition-all"
            >
              <span>💬</span> Get Instant Help on WhatsApp
            </a>

            <button
              type="button"
              onClick={() => {
                setResult(null);
                setIdentifier("");
              }}
              className="text-xs text-dim hover:text-primary transition-colors py-1"
            >
              Try another email or phone number
            </button>
          </div>
        </div>
      )}
    </AuthCard>
  );
}
