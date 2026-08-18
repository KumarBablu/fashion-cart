"use client";

import { useState } from "react";
import Link from "next/link";
import AuthCard from "@/components/AuthCard";
import { useToast } from "@/components/providers/ToastProvider";

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  
  // Step 2: OTP & Reset States
  const [result, setResult] = useState<{
    success: boolean;
    token?: string;
    emailMasked?: string;
    name?: string;
  } | null>(null);

  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const { success, error: toastError } = useToast();

  async function onSubmitSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!identifier.trim()) return;

    setLoading(true);
    setError(null);
    setNotFound(false);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim() }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        if (res.status === 404) {
          setNotFound(true);
        }
        setError(data.error || "Could not process request.");
        return;
      }

      setResult(data);
      success("Verification Code Sent! ✉️", `Sent to ${data.emailMasked}`);
    } catch {
      setError("Network error while trying to retrieve account.");
      setLoading(false);
    }
  }

  async function onSubmitReset(e: React.FormEvent) {
    e.preventDefault();
    if (!result?.token) return;

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (otpCode.trim().length !== 6) {
      setError("Please enter the complete 6-digit verification code sent to your email.");
      return;
    }

    setResetting(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: result.token,
          code: otpCode.trim(),
          newPassword,
        }),
      });

      const data = await res.json();
      setResetting(false);

      if (!res.ok) {
        setError(data.error || "Password reset failed.");
        return;
      }

      setResetSuccess(true);
      success("Password Reset Complete! 🎉", "Your new password has been set successfully.");
    } catch {
      setResetting(false);
      setError("Network error while updating password.");
    }
  }

  return (
    <AuthCard
      title={resetSuccess ? "Password Updated" : result ? "Enter Verification Code" : "Account Recovery"}
      subtitle={
        resetSuccess
          ? "Your credentials have been securely updated"
          : result
          ? `Enter the 6-digit code sent to ${result.emailMasked}`
          : "Enter your registered email address or mobile number to recover your account"
      }
    >
      {/* State 1: Search for Account */}
      {!result && (
        <form onSubmit={onSubmitSearch} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-dim mb-1">
              Registered Email or Mobile Number
            </label>
            <input
              type="text"
              required
              autoFocus
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                setNotFound(false);
                setError(null);
              }}
              placeholder="e.g. your.email@example.com or 9876543210"
              className="w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none focus:border-primary transition-all"
              style={{
                backgroundColor: "var(--fc-bg)",
                borderColor: "var(--fc-border)",
              }}
            />
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-500 space-y-2">
              <p className="font-semibold">{error}</p>
              {notFound && (
                <div className="flex items-center gap-2 pt-1">
                  <Link
                    href="/register"
                    className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold text-[11px] hover:bg-rose-700 transition-all inline-block"
                  >
                    Create Account Now →
                  </Link>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !identifier.trim()}
            className="w-full py-3.5 rounded-full font-bold text-xs uppercase tracking-wider text-white shadow-lg transition-all hover:brightness-105 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            style={{ backgroundColor: "var(--fc-primary)" }}
          >
            {loading ? "Verifying Account in Database…" : "Send 6-Digit Verification Code →"}
          </button>

          <div className="pt-2 text-center">
            <Link href="/login" className="text-xs text-dim hover:text-primary transition-colors">
              ← Remember your password? Sign In
            </Link>
          </div>
        </form>
      )}

      {/* State 2: Verification Code & New Password Form */}
      {result && !resetSuccess && (
        <form onSubmit={onSubmitReset} className="space-y-4 animate-in fade-in duration-300">
          <div
            className="p-4 rounded-2xl border text-center space-y-1.5"
            style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}
          >
            <span className="text-2xl">✉️</span>
            <p className="text-xs font-bold" style={{ color: "var(--fc-text)" }}>
              Verification Code Dispatched
            </p>
            <p className="text-[11px] text-dim">
              We sent a 6-digit code to <strong className="text-primary font-mono">{result.emailMasked}</strong>.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-dim mb-1">
              6-Digit OTP Verification Code *
            </label>
            <input
              type="text"
              required
              maxLength={6}
              autoFocus
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
              className="w-full px-3.5 py-3 rounded-xl border text-base text-center font-mono font-bold tracking-[6px] outline-none focus:border-primary transition-all"
              style={{
                backgroundColor: "var(--fc-bg)",
                borderColor: "var(--fc-border)",
              }}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-dim">
                New Password (min 8 chars) *
              </label>
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="text-[11px] text-dim hover:text-primary transition-colors cursor-pointer"
              >
                {showPassword ? "🙈 Hide" : "👁️ Show"}
              </button>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none focus:border-primary transition-all"
              style={{
                backgroundColor: "var(--fc-bg)",
                borderColor: "var(--fc-border)",
              }}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-dim mb-1">
              Confirm New Password *
            </label>
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none focus:border-primary transition-all"
              style={{
                backgroundColor: "var(--fc-bg)",
                borderColor: "var(--fc-border)",
              }}
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-500 font-semibold">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={resetting || otpCode.length !== 6 || !newPassword || !confirmPassword}
            className="w-full py-3.5 rounded-full font-bold text-xs uppercase tracking-wider text-white shadow-lg transition-all hover:brightness-105 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            style={{ backgroundColor: "var(--fc-primary)" }}
          >
            {resetting ? "Resetting Password…" : "Set New Password & Complete →"}
          </button>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => {
                setResult(null);
                setOtpCode("");
                setError(null);
              }}
              className="text-xs text-dim hover:text-primary transition-colors cursor-pointer"
            >
              ← Use a different email or mobile number
            </button>
          </div>
        </form>
      )}

      {/* State 3: Reset Completed Successfully */}
      {resetSuccess && (
        <div className="space-y-5 animate-in fade-in duration-300 text-center">
          <div
            className="p-6 rounded-2xl border space-y-3 text-center"
            style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}
          >
            <div className="text-4xl">🎉</div>
            <h3 className="font-display text-base font-bold text-primary">Password Reset Successfully!</h3>
            <p className="text-xs text-dim leading-relaxed">
              Your new password has been set. You can now sign into your account with your updated credentials.
            </p>
          </div>

          <Link
            href="/login"
            className="w-full py-3.5 rounded-full font-bold text-xs uppercase tracking-wider text-white shadow-md transition-all hover:brightness-105 inline-block"
            style={{ backgroundColor: "var(--fc-primary)" }}
          >
            Sign In with New Password →
          </Link>
        </div>
      )}
    </AuthCard>
  );
}
