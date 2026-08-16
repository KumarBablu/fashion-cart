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
        <div className="space-y-5 animate-in fade-in duration-300">
          <div
            className="p-4 rounded-2xl border space-y-2 text-left"
            style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}
          >
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <span>✓</span> Recovery Instructions Ready
            </p>
            <p className="text-xs text-dim leading-relaxed">
              We found your account {result.emailMasked ? `associated with ${result.emailMasked}` : ""}.
            </p>
            {result.recoveryCode && (
              <div className="pt-2">
                <span className="text-[11px] font-bold text-dim uppercase">Your 6-Digit Recovery Code:</span>
                <p className="font-mono text-xl font-black text-primary tracking-widest mt-0.5">
                  {result.recoveryCode}
                </p>
              </div>
            )}
          </div>

          {result.resetUrl && (
            <Link
              href={result.resetUrl}
              className="block w-full py-3.5 rounded-full font-bold text-center text-xs uppercase tracking-wider text-white shadow-lg transition-all hover:brightness-105"
              style={{ backgroundColor: "var(--fc-primary)" }}
            >
              Proceed to Reset Password Now →
            </Link>
          )}

          <div className="flex items-center justify-between pt-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setResult(null);
                setIdentifier("");
              }}
              className="text-dim hover:text-primary transition-colors"
            >
              Try another email/phone
            </button>
            <Link href="/login" className="font-bold text-primary hover:underline">
              Back to Login
            </Link>
          </div>
        </div>
      )}
    </AuthCard>
  );
}
