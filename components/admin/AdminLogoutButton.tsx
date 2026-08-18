"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    } finally {
      window.location.href = "/admin/login";
    }
  }

  return (
    <button
      onClick={logout}
      disabled={loggingOut}
      type="button"
      className={
        className ||
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
      }
      title="Securely exit administrative session"
    >
      <span>🚪</span>
      <span>{loggingOut ? "Logging out…" : "Logout"}</span>
    </button>
  );
}
