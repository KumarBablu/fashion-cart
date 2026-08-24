"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import WhatsAppConciergeButton from "@/components/ui/WhatsAppConciergeButton";
import StoreSwitcherPill from "@/components/navigation/StoreSwitcherPill";

type SubCat = {
  id: string;
  name: string;
  slug: string;
};

type HeaderCategory = {
  id: string;
  name: string;
  slug: string;
  children?: SubCat[];
};

export default function MenuDrawer({
  isOpen,
  onClose,
  isLoggedIn = false,
  userName,
  categories = [],
}: {
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn?: boolean;
  userName?: string;
  categories?: HeaderCategory[];
}) {
  const [mounted, setMounted] = useState(false);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("fc_user_session");
        sessionStorage.removeItem("fc_admin_session");
        sessionStorage.removeItem("fc_window_session");
      }
      window.location.href = "/login";
    } catch {
      window.location.href = "/login";
    }
  }

  if (!mounted) return null;

  function getCategoryIcon(name: string) {
    const n = name.toLowerCase();
    if (n.includes("women")) return "👗";
    if (n.includes("men")) return "👔";
    if (n.includes("kid")) return "👶";
    if (n.includes("saree") || n.includes("silk")) return "🥻";
    if (n.includes("jewel") || n.includes("access")) return "👑";
    return "✨";
  }

  const drawerContent = (
    <div
      className={`fixed inset-0 z-[999999] overflow-hidden transition-all duration-300 ${
        isOpen ? "visible pointer-events-auto" : "invisible pointer-events-none"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Navigation Menu"
    >
      {/* Darkened Frosted Backdrop Overlay with Smooth Fade */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-[#141416]/70 backdrop-blur-xs transition-opacity duration-300 ease-out cursor-pointer ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Slide-in Full-Height Luxury Drawer Panel from Left with Smooth Transform */}
      <div className="fixed inset-y-0 left-0 max-w-full flex">
        <aside
          className={`w-[88vw] max-w-[370px] sm:max-w-[400px] h-full bg-[#FAF8F5] text-[#141416] shadow-2xl border-r border-[#E7DFD5] flex flex-col justify-between transform transition-transform duration-300 ease-out ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* 1. Header Section */}
          <div className="p-4 sm:p-5 border-b border-[#E7DFD5] bg-white flex items-center justify-between shrink-0 shadow-xs">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="relative h-9 w-9 shrink-0">
                <Image
                  src="/fashion-cart-logo-transparent.svg"
                  alt="Fashion Cart Luxury Monogram"
                  fill
                  sizes="36px"
                  className="object-contain"
                />
              </div>
              <div className="flex flex-col justify-center">
                <h2 className="font-display text-base sm:text-lg font-black text-[#141416] tracking-tight leading-none">
                  Fashion CART
                </h2>
                <p className="text-[9px] text-[#C59B27] uppercase tracking-[0.22em] font-bold mt-0.5 leading-none">
                  Premium Outlet
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full border border-[#E7DFD5] bg-[#FAF8F5] hover:bg-[#E7DFD5] text-[#141416] flex items-center justify-center transition-all cursor-pointer shadow-xs font-bold active:scale-95"
              aria-label="Close menu drawer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Store Switcher Tab inside Mobile Menu */}
          <div className="px-4 py-2.5 bg-[#FAF8F5] border-b border-[#E7DFD5] flex items-center justify-between shrink-0">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#787C87]">
              Current House
            </span>
            <StoreSwitcherPill />
          </div>

          {/* 2. User Account Card / Sign In Section */}
          <div className="p-3.5 sm:p-4 bg-white border-b border-[#E7DFD5] shrink-0">
            {isLoggedIn ? (
              <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E7DFD5] space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-full bg-[#141416] text-[#C59B27] flex items-center justify-center text-xs font-bold font-mono shadow-xs border border-[#C59B27]/40">
                      {userName ? userName.charAt(0).toUpperCase() : "U"}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-[#141416] truncate max-w-[150px] leading-tight">{userName || "Customer"}</p>
                      <p className="text-[9px] text-[#C59B27] font-bold uppercase tracking-wider mt-0.5">VIP Member</p>
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                  >
                    Sign Out
                  </button>
                </div>

                <div className="pt-2 border-t border-[#E7DFD5]/70 flex items-center justify-between text-xs">
                  <Link
                    href="/account"
                    onClick={onClose}
                    className="font-bold text-[#141416] hover:text-[#C59B27] flex items-center gap-1 transition-colors"
                  >
                    <span>My Account &amp; Orders</span>
                    <span>→</span>
                  </Link>
                  <Link
                    href="/account/wishlist"
                    onClick={onClose}
                    className="font-semibold text-slate-500 hover:text-[#141416] transition-colors"
                  >
                    Wishlist
                  </Link>
                </div>
              </div>
            ) : (
              <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-[#141416] to-[#25262B] text-white space-y-2.5 shadow-sm">
                <div>
                  <h4 className="font-display text-sm font-bold text-white">Welcome to Fashion Cart</h4>
                  <p className="text-[11px] text-white/70 mt-0.5 leading-relaxed">
                    Sign in to track orders, save wishlists, and unlock member discounts.
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Link
                    href="/login"
                    onClick={onClose}
                    className="flex-1 text-center py-2 px-3 rounded-full text-xs font-bold bg-[#C59B27] text-white hover:bg-[#B0881E] transition-all shadow-xs"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    onClick={onClose}
                    className="flex-1 text-center py-2 px-3 rounded-full text-xs font-bold border border-white/30 text-white hover:bg-white/10 transition-all"
                  >
                    Register
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* 3. Navigation Links List (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            
            {/* Quick Actions Strip */}
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/shop"
                onClick={onClose}
                className="p-3 rounded-2xl bg-white border border-[#E7DFD5] hover:border-[#C59B27] flex items-center gap-2.5 transition-all shadow-2xs group"
              >
                <span className="text-lg group-hover:scale-110 transition-transform">🛍️</span>
                <div>
                  <p className="text-xs font-bold text-[#141416] leading-tight">All Products</p>
                  <p className="text-[10px] text-[#787C87]">Browse Catalog</p>
                </div>
              </Link>
              <Link
                href="/shop?sort=newest"
                onClick={onClose}
                className="p-3 rounded-2xl bg-[#FBF4E2] border border-[#C59B27]/40 hover:border-[#C59B27] flex items-center gap-2.5 transition-all shadow-2xs group"
              >
                <span className="text-lg group-hover:scale-110 transition-transform">✨</span>
                <div>
                  <p className="text-xs font-bold text-[#8E6C0C] leading-tight">New Arrivals</p>
                  <p className="text-[10px] text-[#8E6C0C]/80">Fresh Drops</p>
                </div>
              </Link>
            </div>

            {/* Department Categories (Dynamic from DB) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-1 pb-1">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#787C87]">
                  Departments
                </span>
                <Link
                  href="/categories"
                  onClick={onClose}
                  className="text-[10px] font-bold text-[#C59B27] hover:underline"
                >
                  View All Hub →
                </Link>
              </div>

              {categories.map((cat) => {
                const hasSubs = cat.children && cat.children.length > 0;
                const isExpanded = expandedCat === cat.id;

                return (
                  <div
                    key={cat.id}
                    className="rounded-2xl border border-[#E7DFD5] bg-white overflow-hidden shadow-2xs transition-all"
                  >
                    <div className="flex items-center justify-between p-3">
                      <Link
                        href={`/shop?category=${cat.slug}`}
                        onClick={onClose}
                        className="flex items-center gap-2.5 flex-1 text-xs font-bold text-[#141416] hover:text-[#C59B27] transition-colors"
                      >
                        <span className="text-base">{getCategoryIcon(cat.name)}</span>
                        <span>{cat.name}</span>
                      </Link>

                      {hasSubs && (
                        <button
                          onClick={() => setExpandedCat(isExpanded ? null : cat.id)}
                          className="p-1 text-[#787C87] hover:text-[#141416] transition-colors cursor-pointer rounded-lg hover:bg-[#FAF8F5]"
                          aria-label={`Expand ${cat.name} subcategories`}
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                          >
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* Subcategories Accordion */}
                    {hasSubs && isExpanded && (
                      <div className="bg-[#FAF8F5] border-t border-[#E7DFD5] p-2.5 pl-9 space-y-1 text-xs">
                        {cat.children!.map((sub) => (
                          <Link
                            key={sub.id}
                            href={`/shop?category=${sub.slug}`}
                            onClick={onClose}
                            className="block py-1 text-[#4B4E56] hover:text-[#C59B27] font-semibold transition-colors"
                          >
                            • {sub.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Essential Boutique Pages */}
            <div className="space-y-1 pt-1">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#787C87] px-1 block pb-1">
                Explore &amp; Company
              </span>
              <Link
                href="/about"
                onClick={onClose}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-white border border-[#E7DFD5] text-xs font-bold text-[#141416] hover:border-[#C59B27] hover:text-[#C59B27] transition-all shadow-2xs"
              >
                <span>🏛️</span>
                <span>About Fashion Cart</span>
              </Link>
              <Link
                href="/contact"
                onClick={onClose}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-white border border-[#E7DFD5] text-xs font-bold text-[#141416] hover:border-[#C59B27] hover:text-[#C59B27] transition-all shadow-2xs"
              >
                <span>📞</span>
                <span>Contact Desk &amp; Concierge</span>
              </Link>
              <Link
                href="/shipping-policy"
                onClick={onClose}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-white border border-[#E7DFD5] text-xs font-bold text-[#141416] hover:border-[#C59B27] hover:text-[#C59B27] transition-all shadow-2xs"
              >
                <span>🚚</span>
                <span>Shipping &amp; Delivery Policies</span>
              </Link>
              <Link
                href="/return-policy"
                onClick={onClose}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-white border border-[#E7DFD5] text-xs font-bold text-[#141416] hover:border-[#C59B27] hover:text-[#C59B27] transition-all shadow-2xs"
              >
                <span>🔄</span>
                <span>7-Day Return &amp; Exchange Guarantee</span>
              </Link>
            </div>

            {/* Store Services & Concierge */}
            <div className="p-3.5 rounded-2xl bg-white border border-[#E7DFD5] space-y-2 shadow-2xs">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#787C87] block">
                Store Concierge
              </span>
              <div className="space-y-1 text-xs font-semibold">
                <Link
                  href="/account"
                  onClick={onClose}
                  className="flex items-center justify-between py-1 text-[#141416] hover:text-[#C59B27] transition-colors"
                >
                  <span>📦 Track Live Orders &amp; Invoices</span>
                  <span>→</span>
                </Link>
                <WhatsAppConciergeButton
                  className="w-full flex items-center justify-between py-1 text-[#141416] hover:text-[#C59B27] transition-colors cursor-pointer bg-transparent border-none p-0 text-left font-semibold text-xs"
                  customMessage="Hi Fashion Cart Stylist, I am exploring your catalog from the menu drawer and would like personalized styling advice."
                >
                  <span>💬 WhatsApp Stylist Concierge</span>
                  <span>→</span>
                </WhatsAppConciergeButton>
              </div>
            </div>

          </div>

          {/* 5. Bottom Footer */}
          <div className="p-3.5 border-t border-[#E7DFD5] bg-white flex items-center justify-between text-xs text-[#787C87] shrink-0">
            <span className="text-[11px]">Fashion Cart Premium Outlet · 2026</span>
            <Link
              href="/contact"
              onClick={onClose}
              className="text-[11px] font-bold text-[#141416] hover:text-[#C59B27] hover:underline"
            >
              Concierge →
            </Link>
          </div>

        </aside>
      </div>
    </div>
  );

  return createPortal(drawerContent, document.body);
}
