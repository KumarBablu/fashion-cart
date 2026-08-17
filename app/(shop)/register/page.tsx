"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthCard from "@/components/AuthCard";
import { useToast } from "@/components/providers/ToastProvider";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { success } = useToast();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          password,
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error ?? "Registration failed.");
        return;
      }

      success("Account Created! 🎉", `Welcome to Fashion Cart, ${name.trim()}!`);
      window.location.href = "/account";
    } catch {
      setError("Network error while creating your account.");
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Create Account"
      subtitle="Join Fashion Cart for faster checkout, order tracking, and member-only drops"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-dim mb-1">
            Full Name *
          </label>
          <input
            type="text"
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Asha Sharma"
            className="w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none focus:border-primary transition-all"
            style={{
              backgroundColor: "var(--fc-bg)",
              borderColor: "var(--fc-border)",
            }}
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-dim mb-1">
            Email Address *
          </label>
          <input
            type="email"
            required
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
          <label className="block text-xs font-bold uppercase tracking-wider text-dim mb-1">
            Mobile Number (Optional)
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. 9876543210"
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
              Password (min 8 chars) *
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
          disabled={loading || !name || !email || !password}
          className="w-full py-3.5 rounded-full font-bold text-xs uppercase tracking-wider text-white shadow-lg transition-all hover:brightness-105 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-2"
          style={{
            backgroundColor: "var(--fc-primary)",
          }}
        >
          {loading ? (
            <>
              <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              <span>Creating Account…</span>
            </>
          ) : (
            <span>Create New Account →</span>
          )}
        </button>

        <div className="pt-4 border-t text-center" style={{ borderColor: "var(--fc-border)" }}>
          <p className="text-xs text-dim">
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-primary hover:underline">
              Sign In Here
            </Link>
          </p>
        </div>
      </form>
    </AuthCard>
  );
}
