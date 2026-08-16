"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

      if (!res.ok) {
        setLoading(false);
        setError(data.error ?? "Login failed.");
        return;
      }

      if (data.user.role !== "ADMIN") {
        await fetch("/api/auth/logout", { method: "POST" });
        setLoading(false);
        setError("This account does not have administrator privileges.");
        return;
      }

      router.push("/admin/dashboard");
      router.refresh();
    } catch {
      setError("Network error while trying to login to admin console.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#FAF8F5] text-[#0C3B2E]">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-3">
          <Link href="/" className="inline-flex flex-col items-center gap-1.5 group">
            <div className="relative h-14 w-14 overflow-hidden transition-transform duration-200 group-hover:scale-105">
              <Image
                src="/fashion-cart-logo-transparent.svg"
                alt="Fashion Cart Official Logo"
                fill
                sizes="56px"
                priority
                className="object-contain"
              />
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0C3B2E]">
              Fashion Cart Admin
            </h1>
          </Link>
          <p className="text-xs text-[#5B7A6F]">Secure administrative portal for boutique management</p>
        </div>

        <div className="rounded-3xl border border-[#E8E3D8] bg-white p-6 sm:p-8 shadow-2xl space-y-5">
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5B7A6F] mb-1">
                Admin Email Address
              </label>
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E3D8] bg-[#FAF8F5] text-xs outline-none focus:border-[#0C3B2E] transition-all text-[#0C3B2E]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5B7A6F]">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="text-[11px] text-[#5B7A6F] hover:text-[#0C3B2E] transition-colors"
                >
                  {showPassword ? "🙈 Hide" : "👁️ Show"}
                </button>
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E3D8] bg-[#FAF8F5] text-xs outline-none focus:border-[#0C3B2E] transition-all text-[#0C3B2E]"
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-600 font-semibold">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full py-3.5 rounded-full font-bold text-xs uppercase tracking-wider bg-[#0C3B2E] text-white hover:bg-[#144E3E] shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Authenticating…</span>
                </>
              ) : (
                <span>Login to Admin Console →</span>
              )}
            </button>
          </form>

          <div className="pt-3 border-t border-[#E8E3D8] text-center">
            <Link href="/" className="text-xs text-[#5B7A6F] hover:text-[#0C3B2E] transition-colors">
              ← Return to Customer Storefront
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
