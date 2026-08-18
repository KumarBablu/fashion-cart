import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getCurrentAdmin } from "@/lib/auth/session";
import AdminLogoutButton from "@/components/admin/AdminLogoutButton";
import AdminWindowSessionGuard from "@/components/admin/AdminWindowSessionGuard";

const NAV = [
  { href: "/admin/dashboard", label: "Analytics Dashboard", icon: "📊" },
  { href: "/admin/products", label: "Products Catalog", icon: "👗" },
  { href: "/admin/categories", label: "Categories", icon: "🗂️" },
  { href: "/admin/inventory", label: "Stock & Inventory", icon: "📦" },
  { href: "/admin/orders", label: "Orders Fulfillment", icon: "🚚" },
  { href: "/admin/payments", label: "Payment Verification", icon: "💳" },
  { href: "/admin/coupons", label: "Coupons & Promos", icon: "🏷️" },
  { href: "/admin/reviews", label: "Customer Reviews", icon: "⭐" },
  { href: "/admin/emails", label: "Email Audit Logs", icon: "✉️" },
  { href: "/admin/customers", label: "Customer CRM", icon: "👥" },
  { href: "/admin/settings", label: "Store Settings & Export", icon: "⚙️" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  return (
    <div className="min-h-screen flex bg-[#FAF8F5] text-[#0C3B2E]">
      <AdminWindowSessionGuard />
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-[#E8E3D8] bg-white transition-colors">
        {/* Brand Header */}
        <div className="p-5 border-b border-[#E8E3D8] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative h-8 w-8 overflow-hidden">
              <Image
                src="/fashion-cart-logo-transparent.svg"
                alt="Fashion Cart Official Logo"
                fill
                sizes="32px"
                className="object-contain"
              />
            </div>
            <div>
              <span className="font-display font-bold text-sm block leading-none text-[#0C3B2E]">
                Fashion Cart
              </span>
              <span className="text-[10px] text-[#BB8A52] font-bold uppercase tracking-wider">
                Admin Console
              </span>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold hover:bg-[#F2EFE8] text-[#0C3B2E] transition-colors"
            >
              <span className="text-sm">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Footer with Administrator Identity & Visible Logout */}
        <div className="p-4 border-t border-[#E8E3D8] space-y-3 bg-[#FAF8F5]">
          <div className="p-2.5 rounded-xl border border-[#E8E3D8] bg-white space-y-1 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                👑 Super Admin
              </span>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" title="Online" />
            </div>
            <p className="font-bold text-xs truncate text-[#0C3B2E]">{admin.name}</p>
            <p className="text-[10px] text-[#5B7A6F] truncate">{admin.email}</p>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <Link
              href="/"
              target="_blank"
              className="text-[11px] font-bold text-[#0C3B2E] hover:underline flex items-center gap-1"
            >
              <span>🛍️ Store</span> ↗
            </Link>
            <AdminLogoutButton />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Top Header Bar (Desktop & Mobile) */}
        <header className="sticky top-0 z-30 border-b border-[#E8E3D8] bg-white/95 backdrop-blur-md px-4 sm:px-6 py-3 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="md:hidden relative h-7 w-7 overflow-hidden">
              <Image
                src="/fashion-cart-logo-transparent.svg"
                alt="Logo"
                fill
                sizes="28px"
                className="object-contain"
              />
            </div>
            <div>
              <span className="font-display font-bold text-sm sm:text-base text-[#0C3B2E] block leading-none">
                Fashion Cart Operations
              </span>
              <span className="text-[10px] text-[#787C87] hidden sm:inline">
                Live Server Time: {new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E8E3D8] bg-[#FAF8F5] text-xs font-semibold text-[#0C3B2E] hover:bg-[#F2EFE8] transition-colors"
            >
              <span>🛍️</span> View Storefront
            </Link>
            <AdminLogoutButton />
          </div>
        </header>

        {/* Mobile Navigation Horizontal Strip */}
        <div className="md:hidden overflow-x-auto p-2 border-b border-[#E8E3D8] bg-white flex gap-1.5 text-xs whitespace-nowrap shadow-2xs">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-1.5 rounded-xl border border-[#E8E3D8] text-[11px] font-semibold text-[#0C3B2E] hover:bg-[#FAF8F5] transition-colors"
            >
              {item.icon} {item.label.split(" ")[0]}
            </Link>
          ))}
        </div>

        {/* Page Content Container */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</div>
      </main>
    </div>
  );
}
