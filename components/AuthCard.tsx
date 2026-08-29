import Link from "next/link";
import Image from "next/image";

export default function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12 sm:py-16">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header with Official Logo */}
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
            <div className="flex flex-col items-center">
              <span className="font-display font-black text-xl tracking-tight text-[#141416]">
                Fashion CART
              </span>
              <span className="text-[9px] uppercase tracking-[0.24em] font-bold text-[#C59B27] mt-0.5">
                Premium Outlet
              </span>
            </div>
          </Link>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#141416]">
            {title}
          </h1>
          {subtitle && <p className="text-xs text-[#787C87] max-w-xs mx-auto leading-relaxed">{subtitle}</p>}
        </div>

        {/* Card Container */}
        <div className="rounded-2xl border border-[#E7DFD5] bg-white p-6 sm:p-8 shadow-md">
          {children}
        </div>
      </div>
    </div>
  );
}
