import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getCurrentAdmin } from "@/lib/auth/session";
import AdminLogoutButton from "@/components/admin/AdminLogoutButton";
import AdminWindowSessionGuard from "@/components/admin/AdminWindowSessionGuard";
import AdminStoreSwitcher from "@/components/admin/AdminStoreSwitcher";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const cookieStore = await cookies();
  const activeStore = cookieStore.get("fc_admin_store")?.value === "jewellery" ? "jewellery" : "garments";

  const NAV = [
    { href: "/admin/dashboard", label: "Analytics Dashboard", icon: "📊" },
    {
      href: "/admin/products",
      label: activeStore === "jewellery" ? "Jewellery Catalog" : "Garments Catalog",
      icon: activeStore === "jewellery" ? "💍" : "👗",
    },
    { href: "/admin/categories", label: "Categories", icon: "🗂️" },
    { href: "/admin/sellers", label: "Sellers & Suppliers", icon: "🏭" },
    { href: "/admin/inventory", label: "Stock & Inventory", icon: "📦" },
    { href: "/admin/orders", label: "Orders Fulfillment", icon: "🚚" },
    { href: "/admin/payments", label: "Payment Verification", icon: "💳" },
    { href: "/admin/coupons", label: "Coupons & Discounts", icon: "🏷️" },
    { href: "/admin/promotions", label: "Promotions & Banners", icon: "✨" },
    { href: "/admin/reviews", label: "Customer Reviews", icon: "⭐" },
    { href: "/admin/emails", label: "Email Audit Logs", icon: "✉️" },
    { href: "/admin/customers", label: "Customer CRM", icon: "👥" },
    { href: "/admin/settings", label: "Store Settings & Export", icon: "⚙️" },
  ];

  return (
    <div className="fixed inset-0 h-screen w-screen overflow-hidden flex bg-[#FAF8F5] text-[#0C3B2E]">
      <AdminWindowSessionGuard />
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col h-full border-r border-[#E8E3D8] bg-white transition-colors">
        {/* Brand Header */}
        <div className="p-5 border-b border-[#E8E3D8] flex items-center justify-between shrink-0">
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
              <span className={`text-[10px] font-bold uppercase tracking-wider ${
                activeStore === "jewellery" ? "text-[#8E6C0C]" : "text-[#BB8A52]"
              }`}>
                {activeStore === "jewellery" ? "Jewellery Admin" : "Garments Admin"}
              </span>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={`${item.href}?store=${activeStore}`}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold hover:bg-[#F2EFE8] text-[#0C3B2E] transition-colors"
            >
              <span className="text-sm">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Footer with Administrator Identity & Visible Logout */}
        <div className="p-4 border-t border-[#E8E3D8] space-y-3 bg-[#FAF8F5] shrink-0">
          <div className="p-2.5 rounded-xl border border-[#E8E3D8] bg-white space-y-1 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                activeStore === "jewellery" ? "text-[#8E6C0C] bg-[#FBF4E2] border-[#C59B27]/40" : "text-amber-700 bg-amber-50 border-amber-200"
              }`}>
                {activeStore === "jewellery" ? "💍 Jewellery Admin" : "👗 Garments Admin"}
              </span>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" title="Online" />
            </div>
            <p className="font-bold text-xs truncate text-[#0C3B2E]">{admin.name}</p>
            <p className="text-[10px] text-[#5B7A6F] truncate">{admin.email}</p>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <Link
              href={activeStore === "jewellery" ? "/jewellery" : "/garments"}
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
      <main className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
        {/* Top Header Bar (Desktop & Mobile) */}
        <header className="shrink-0 border-b border-[#E8E3D8] bg-white/95 backdrop-blur-md px-4 sm:px-6 py-3 flex items-center justify-between shadow-2xs z-30">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="font-display text-sm sm:text-base font-bold text-[#0C3B2E]">
                Fashion Cart Operations
              </h2>
              <p className="text-[10px] text-[#787C87] font-medium hidden sm:block">
                Connected DB: <span className="font-bold text-slate-800 uppercase">{activeStore}</span> ({activeStore === "jewellery" ? "Sydney Pooler" : "Mumbai Pooler"})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Global Store Switcher */}
            <AdminStoreSwitcher />

            <Link
              href={activeStore === "jewellery" ? "/jewellery" : "/garments"}
              target="_blank"
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-xl border border-[#E8E3D8] hover:border-[#0C3B2E] bg-white transition-colors"
            >
              <span>🛍️ View Storefront</span>
            </Link>

            <AdminLogoutButton />
          </div>
        </header>

        {/* Dynamic Admin Page Workspace View */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
