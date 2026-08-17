"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import AuthCard from "@/components/AuthCard";
import { useToast } from "@/components/providers/ToastProvider";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [token, setToken] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successState, setSuccessState] = useState(false);

  const { success } = useToast();

  useEffect(() => {
    const t = searchParams.get("token");
    if (t) setToken(t);
  }, [searchParams]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      setError("Reset token is missing. Please request a new password reset link.");
      return;
    }
    if (!code || code.trim().length !== 6) {
      setError("Please enter the 6-digit recovery code sent to your email.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, code: code.trim(), newPassword: password }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error || "Password reset failed.");
        return;
      }

      setSuccessState(true);
      success("Password Reset! 🎉", "Your password has been updated. Please login.");
      setTimeout(() => {
        router.push("/login");
      }, 2500);
    } catch {
      setError("Network error while resetting password.");
      setLoading(false);
    }
  }

  if (successState) {
    return (
      <div className="text-center space-y-4 py-4">
        <div className="text-5xl">🎉</div>
        <h2 className="font-display text-xl font-bold">Password Updated Successfully!</h2>
        <p className="text-xs text-dim max-w-xs mx-auto">
          Your account credentials have been securely updated. Redirecting you to login…
        </p>
        <div className="pt-2">
          <Link
            href="/login"
            className="inline-block px-8 py-3 rounded-full font-bold text-xs uppercase tracking-wider text-white shadow-md"
            style={{ backgroundColor: "var(--fc-primary)" }}
          >
            Login to Your Account Now →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* 6-Digit Recovery Verification Code */}
      <div className="p-3.5 rounded-2xl border bg-[#0C3B2E]/5 border-[#0C3B2E]/15 dark:bg-white/5 space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold uppercase tracking-wider text-primary">
            6-Digit Recovery Code *
          </label>
          <span className="text-[10px] text-dim font-medium">Check your email</span>
        </div>
        <input
          type="text"
          required
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
          placeholder="e.g. 486473"
          className="w-full px-3.5 py-2.5 rounded-xl border text-center text-lg font-mono font-bold tracking-[0.3em] outline-none focus:border-primary"
          style={{
            backgroundColor: "var(--fc-bg)",
            borderColor: "var(--fc-border)",
            letterSpacing: "0.3em",
          }}
        />
        <p className="text-[11px] text-dim">
          Enter the 6-digit verification code displayed in your password reset email.
        </p>
      </div>

      {!searchParams.get("token") && (
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-dim mb-1">
            Reset Token
          </label>
          <input
            type="text"
            required
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste your reset token here"
            className="w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono outline-none focus:border-primary"
            style={{
              backgroundColor: "var(--fc-bg)",
              borderColor: "var(--fc-border)",
            }}
          />
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-bold uppercase tracking-wider text-dim">
            New Password (min 8 chars)
          </label>
          <button
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            className="text-[11px] text-dim hover:text-primary transition-colors"
          >
            {showPassword ? "🙈 Hide" : "👁️ Show"}
          </button>
        </div>
        <input
          type={showPassword ? "text" : "password"}
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none focus:border-primary"
          style={{
            backgroundColor: "var(--fc-bg)",
            borderColor: "var(--fc-border)",
          }}
        />
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-dim mb-1">
          Confirm New Password
        </label>
        <input
          type={showPassword ? "text" : "password"}
          required
          minLength={8}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none focus:border-primary"
          style={{
            backgroundColor: "var(--fc-bg)",
            borderColor: "var(--fc-border)",
          }}
        />
      </div>

      {error && <p className="text-xs text-rose-500 font-semibold">{error}</p>}

      <button
        type="submit"
        disabled={loading || !password || !confirmPassword}
        className="w-full py-3.5 rounded-full font-bold text-xs uppercase tracking-wider text-white shadow-lg transition-all hover:brightness-105 disabled:opacity-50"
        style={{ backgroundColor: "var(--fc-primary)" }}
      >
        {loading ? "Resetting Password…" : "Save New Password & Login →"}
      </button>

      <div className="pt-2 text-center">
        <Link href="/login" className="text-xs text-dim hover:text-primary transition-colors">
          ← Cancel and Return to Login
        </Link>
      </div>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthCard
      title="Create New Password"
      subtitle="Set a new secure password for your Fashion Cart account"
    >
      <Suspense fallback={<div className="text-center text-xs text-dim py-6">Loading reset form…</div>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthCard>
  );
}
