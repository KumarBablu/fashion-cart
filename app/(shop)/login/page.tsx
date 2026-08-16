"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AuthCard from "@/components/AuthCard";
import { useToast } from "@/components/providers/ToastProvider";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { success } = useToast();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error ?? "Invalid email or password.");
        return;
      }

      success("Welcome Back! 👋", `Logged in as ${data.user?.name || "Customer"}`);
      const next = searchParams.get("next") || "/account";
      router.push(next);
      router.refresh();
    } catch {
      setError("Network error while attempting to login.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-dim mb-1">
          Email Address
        </label>
        <input
          type="email"
          required
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your.email@example.com"
          className="w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none focus:border-primary transition-all"
          style={{
            backgroundColor: "var(--fc-bg)",
            borderColor: "var(--fc-border)",
          }}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-bold uppercase tracking-wider text-dim">
            Password
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="text-[11px] text-dim hover:text-primary transition-colors"
            >
              {showPassword ? "🙈 Hide" : "👁️ Show"}
            </button>
            <Link
              href="/forgot-password"
              className="text-[11px] font-bold text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </div>
        <input
          type={showPassword ? "text" : "password"}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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

      {/* High-visibility themed button */}
      <button
        type="submit"
        disabled={loading || !email || !password}
        className="w-full py-3.5 rounded-full font-bold text-xs uppercase tracking-wider text-white shadow-lg transition-all hover:brightness-105 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-2"
        style={{
          backgroundColor: "var(--fc-primary)",
        }}
      >
        {loading ? (
          <>
            <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
            <span>Logging in…</span>
          </>
        ) : (
          <span>Sign In to Account →</span>
        )}
      </button>

      {/* Forgot Details & Sign Up Links */}
      <div className="pt-4 border-t space-y-2 text-center" style={{ borderColor: "var(--fc-border)" }}>
        <p className="text-xs text-dim">
          Don&apos;t have an account yet?{" "}
          <Link href="/register" className="font-bold text-primary hover:underline">
            Create an Account
          </Link>
        </p>

        <p className="text-[11px] text-dim">
          Trouble logging in?{" "}
          <Link href="/forgot-password" className="text-primary hover:underline">
            Retrieve Login Details
          </Link>
        </p>
      </div>
    </form>
  );
}

export default function LoginPage() {
  return (
    <AuthCard title="Sign In" subtitle="Welcome back to your Fashion Cart shopping account">
      <Suspense fallback={<div className="text-center text-xs text-dim py-8">Loading sign-in form…</div>}>
        <LoginForm />
      </Suspense>
    </AuthCard>
  );
}
