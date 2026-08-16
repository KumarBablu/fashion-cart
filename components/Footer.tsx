import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-[#E8E3D8] bg-[#0C3B2E] text-white">
      {/* 4 Value Propositions Bar */}
      <div className="border-b border-white/10 bg-black/15">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center sm:text-left">
            <div className="flex items-center gap-3.5">
              <span className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg bg-white/10 text-[#FFBA00] border border-white/15 shadow-xs shrink-0">
                🚚
              </span>
              <div>
                <p className="text-xs font-bold text-white">Free Express Shipping</p>
                <p className="text-[10px] text-white/70">On all orders above ₹499</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <span className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg bg-white/10 text-[#FFBA00] border border-white/15 shadow-xs shrink-0">
                🔄
              </span>
              <div>
                <p className="text-xs font-bold text-white">7-Day Easy Returns</p>
                <p className="text-[10px] text-white/70">Instant doorstep exchange</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <span className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg bg-white/10 text-[#FFBA00] border border-white/15 shadow-xs shrink-0">
                🛡️
              </span>
              <div>
                <p className="text-xs font-bold text-white">100% Certified Quality</p>
                <p className="text-[10px] text-white/70">Direct from master ateliers</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <span className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg bg-white/10 text-[#FFBA00] border border-white/15 shadow-xs shrink-0">
                🧾
              </span>
              <div>
                <p className="text-xs font-bold text-white">Instant GST Tax Invoice</p>
                <p className="text-[10px] text-white/70">1-Click PDF download</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand & About */}
          <div className="lg:col-span-2 space-y-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative h-10 w-10 overflow-hidden bg-white/10 rounded-xl p-1 border border-white/15">
                <Image
                  src="/fashion-cart-logo-transparent.svg"
                  alt="Fashion Cart Logo"
                  fill
                  sizes="40px"
                  className="object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-display font-black text-xl tracking-tight text-white leading-none">
                  Fashion Cart
                </span>
                <span className="text-[9px] uppercase tracking-[0.25em] font-semibold text-[#FFBA00] leading-tight mt-0.5">
                  Haute Couture
                </span>
              </div>
            </Link>
            <p className="text-xs text-white/80 leading-relaxed max-w-sm">
              Your premier destination for contemporary everyday apparel, luxury ethnic kurtis, breathable shirts, and precision-tailored garments. Designed for comfort and confidence.
            </p>
            <div className="flex items-center gap-3 pt-1 text-xs text-white/70">
              <span>📍 Bengaluru, India</span>
              <span>·</span>
              <span>✉️ support@fashioncart.shop</span>
            </div>
          </div>

          {/* Quick Shop Links */}
          <div className="space-y-2.5">
            <p className="text-xs font-bold uppercase tracking-wider text-[#FFBA00]">Catalog</p>
            <ul className="space-y-2 text-xs text-white/80">
              <li><Link href="/shop" className="hover:text-[#FFBA00] transition-colors">All Products</Link></li>
              <li><Link href="/shop?sort=newest" className="hover:text-[#FFBA00] transition-colors">New Arrivals</Link></li>
              <li><Link href="/shop?category=men-shirts" className="hover:text-[#FFBA00] transition-colors">Men&apos;s Collection</Link></li>
              <li><Link href="/shop?category=women-kurtis" className="hover:text-[#FFBA00] transition-colors">Women&apos;s Ethnic</Link></li>
              <li><Link href="/categories" className="hover:text-[#FFBA00] transition-colors">Categories Hub</Link></li>
            </ul>
          </div>

          {/* Account & Policies */}
          <div className="space-y-2.5">
            <p className="text-xs font-bold uppercase tracking-wider text-[#FFBA00]">Customer Care</p>
            <ul className="space-y-2 text-xs text-white/80">
              <li><Link href="/account" className="hover:text-[#FFBA00] transition-colors">Track Your Order</Link></li>
              <li><Link href="/account/wishlist" className="hover:text-[#FFBA00] transition-colors">My Wishlist</Link></li>
              <li><Link href="/shipping-policy" className="hover:text-[#FFBA00] transition-colors">Shipping &amp; Delivery</Link></li>
              <li><Link href="/return-policy" className="hover:text-[#FFBA00] transition-colors">Returns &amp; Refunds</Link></li>
              <li><Link href="/privacy-policy" className="hover:text-[#FFBA00] transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Newsletter Box */}
          <div className="space-y-2.5">
            <p className="text-xs font-bold uppercase tracking-wider text-[#FFBA00]">Stay Connected</p>
            <p className="text-xs text-white/80">
              Subscribe for exclusive secret drop alerts and festive coupon codes.
            </p>
            <div className="flex gap-2 pt-1">
              <input
                type="email"
                placeholder="Enter email address"
                className="w-full px-3 py-2 rounded-xl border border-white/20 text-xs outline-none focus:border-[#FFBA00] bg-white/10 text-white placeholder:text-white/50"
              />
              <button
                type="button"
                className="px-4 py-2 rounded-xl text-xs font-extrabold uppercase bg-[#FFBA00] text-[#0C3B2E] hover:bg-[#EAA800] shadow-sm transition-colors"
              >
                Join
              </button>
            </div>
            <p className="text-[10px] text-white/60">Instant UPI, QR Code, and Cash on Delivery Accepted.</p>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/60">
          <p>© {new Date().getFullYear()} Fashion Cart Boutique. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-[#FFBA00] transition-colors">Terms of Service</Link>
            <Link href="/privacy-policy" className="hover:text-[#FFBA00] transition-colors">Privacy</Link>
            <Link href="/admin/login" className="hover:text-[#FFBA00] transition-colors opacity-60">Admin Portal</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
