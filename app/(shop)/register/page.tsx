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

    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    if (cleanPhone.length < 10) {
      setError("Please enter a valid 10-digit mobile number.");
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
          email: email.trim().toLowerCase(),
          phone: cleanPhone,
          password,
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error ?? "Registration failed.");
        return;
      }

      if (typeof window !== "undefined") {
        sessionStorage.setItem("fc_user_session", "active");
        sessionStorage.setItem("fc_window_session", "active");
        sessionStorage.setItem("fc_just_logged_in", "true");
        sessionStorage.setItem("fc_session_start_time", Date.now().toString());
        sessionStorage.removeItem("fc_promo_modal_closed_in_view");
        sessionStorage.removeItem("fc_promo_banner_dismissed");
      }

      success("Account Created! 🎉", `Welcome to Fashion CART, ${name.trim()}!`);
      window.location.href = "/";
    } catch {
      setError("Network error while creating your account.");
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Create Account"
      subtitle="Join Fashion CART for express checkout, order tracking, and VIP member drops"
    >
      <div className="space-y-5">
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
              placeholder="e.g. asha@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none focus:border-primary transition-all"
              style={{
                backgroundColor: "var(--fc-bg)",
                borderColor: "var(--fc-border)",
              }}
            />
            <p className="text-[10px] text-dim mt-1">We will send order receipts and tracking links here.</p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-dim mb-1">
              10-Digit Mobile Phone Number *
            </label>
            <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: "var(--fc-border)" }}>
              <span
                className="px-3.5 py-2.5 text-xs font-bold flex items-center border-r"
                style={{
                  backgroundColor: "var(--fc-surface)",
                  borderColor: "var(--fc-border)",
                  color: "var(--fc-text)",
                }}
              >
                🇮🇳 +91
              </span>
              <input
                type="tel"
                required
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="9876543210"
                className="w-full px-3.5 py-2.5 text-xs outline-none focus:border-primary transition-all"
                style={{
                  backgroundColor: "var(--fc-bg)",
                }}
              />
            </div>
            <p className="text-[10px] text-dim mt-1">Required for instant WhatsApp shipping updates &amp; delivery OTP.</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-dim">
                Password * (min. 8 characters)
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
            disabled={loading || !name || !email || !phone || !password}
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
              <span>Complete Registration →</span>
            )}
          </button>

          <p className="text-center text-xs text-dim pt-3 border-t" style={{ borderColor: "var(--fc-border)" }}>
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-primary hover:underline">
              Sign In Instead
            </Link>
          </p>
        </form>
      </div>
    </AuthCard>
  );
}
