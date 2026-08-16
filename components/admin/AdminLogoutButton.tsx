"use client";

import { useRouter } from "next/navigation";

export default function AdminLogoutButton() {
  const router = useRouter();
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }
  return (
    <button onClick={logout} className="rounded-md px-3 py-1.5 text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors">
      Logout
    </button>
  );
}
