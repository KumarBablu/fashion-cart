import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getCurrentAdmin } from "@/lib/auth/session";
import AdminLogoutButton from "@/components/admin/AdminLogoutButton";

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
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-[#E8E3D8] bg-white transition-colors">
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

        <div className="p-4 border-t border-[#E8E3D8] space-y-3 bg-[#FAF8F5]">
          <div className="text-xs">
            <p className="font-bold truncate text-[#0C3B2E]">{admin.name}</p>
            <p className="text-[11px] text-[#5B7A6F] truncate">{admin.email}</p>
          </div>
          <div className="flex items-center justify-between pt-1">
            <Link
              href="/"
              target="_blank"
              className="text-[11px] font-semibold text-[#0C3B2E] hover:underline"
            >
              View Storefront ↗
            </Link>
            <AdminLogoutButton />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col">
        <div className="md:hidden border-b border-[#E8E3D8] bg-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative h-7 w-7 overflow-hidden">
              <Image
                src="/fashion-cart-logo-transparent.svg"
                alt="Logo"
                fill
                sizes="28px"
                className="object-contain"
              />
            </div>
            <span className="font-display font-bold text-base text-[#0C3B2E]">Fashion Cart Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <AdminLogoutButton />
          </div>
        </div>

        {/* Mobile Navigation Strip */}
        <div className="md:hidden overflow-x-auto p-2 border-b border-[#E8E3D8] bg-white flex gap-1 text-xs whitespace-nowrap">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-1.5 rounded-lg border border-[#E8E3D8] text-[11px] text-[#0C3B2E]"
            >
              {item.icon} {item.label.split(" ")[0]}
            </Link>
          ))}
        </div>

        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</div>
      </main>
    </div>
  );
}
