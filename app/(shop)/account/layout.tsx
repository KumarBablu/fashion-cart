import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import LogoutButton from "@/components/account/LogoutButton";
import AccountSessionGuard from "@/components/account/AccountSessionGuard";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");

  const NAV_ITEMS = [
    { href: "/account", label: "My Orders", icon: "📦" },
    { href: "/account/wishlist", label: "My Wishlist", icon: "❤️" },
    { href: "/account/addresses", label: "Saved Addresses", icon: "📍" },
    { href: "/account/profile", label: "Profile & Security", icon: "👤" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
      <AccountSessionGuard />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E8E3D8]">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 overflow-hidden">
            <Image
              src="/fashion-cart-logo-transparent.svg"
              alt="Fashion Cart Logo"
              fill
              sizes="40px"
              className="object-contain"
            />
          </div>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0C3B2E]">My Account</h1>
            <p className="text-xs text-[#5B7A6F] mt-0.5">
              Welcome back, <span className="font-bold text-[#0C3B2E]">{user.name}</span> ({user.email})
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/shop"
            className="px-4 py-2 rounded-full border text-xs font-bold uppercase tracking-wider hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            style={{ borderColor: "var(--fc-border)" }}
          >
            Continue Shopping →
          </Link>
          <LogoutButton />
        </div>
      </div>

      {(user.role === "ADMIN" || user.email === "bablusoni2825@gmail.com") && (
        <div className="mt-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">👑</span>
            <div>
              <p className="text-xs font-bold text-amber-700 dark:text-amber-300">
                Administrator Account Active
              </p>
              <p className="text-[11px] text-dim">
                You have full administrative privileges to manage orders, inventory, CRM, and payments.
              </p>
            </div>
          </div>
          <Link
            href="/admin/dashboard"
            className="px-4 py-2 rounded-xl bg-[#141416] text-white text-xs font-bold hover:bg-[#25262B] transition-all shadow-sm flex items-center gap-1.5"
          >
            <span>🚀</span> Open Admin Console
          </Link>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-[220px_1fr]">
        <aside>
          <nav
            className="flex flex-col p-2 rounded-2xl border space-y-1"
            style={{
              backgroundColor: "var(--fc-surface)",
              borderColor: "var(--fc-border)",
            }}
          >
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                style={{ color: "var(--fc-text)" }}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </aside>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
