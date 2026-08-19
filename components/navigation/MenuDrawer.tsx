"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";

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
      sessionStorage.removeItem("fc_window_session");
      window.location.href = "/login";
    } catch {
      window.location.href = "/login";
    }
  }

  if (!isOpen || !mounted) return null;

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
      className="fixed inset-0 z-[999999] overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Atelier Navigation Menu"
    >
      {/* Darkened Frosted Backdrop Overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-[#141416]/70 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in cursor-pointer"
      />

      {/* Slide-in Full-Height Luxury Drawer Panel from Left */}
      <div className="fixed inset-y-0 left-0 max-w-full flex">
        <aside className="w-[88vw] max-w-[370px] sm:max-w-[400px] h-full bg-[#FAF8F5] text-[#141416] shadow-2xl border-r border-[#E7DFD5] flex flex-col justify-between transition-transform duration-300 ease-out animate-in slide-in-from-left">
          
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
                  Fashion Cart
                </h2>
                <p className="text-[9px] text-[#C59B27] uppercase tracking-[0.22em] font-bold mt-0.5 leading-none">
                  Luxury Atelier
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
                  <p className="text-[11px] text-slate-300">Sign in to track orders, save wishlists, and unlock member privileges.</p>
                </div>
                <div className="flex items-center gap-2 pt-0.5">
                  <Link
                    href="/login"
                    onClick={onClose}
                    className="flex-1 py-2 px-3 rounded-xl bg-[#C59B27] hover:bg-[#D8AE3A] text-black font-bold text-xs text-center uppercase tracking-wider transition-colors shadow-xs"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    onClick={onClose}
                    className="flex-1 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs text-center uppercase tracking-wider transition-colors border border-white/20"
                  >
                    Register
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* 3. VIP Promo Gift Ribbon */}
          <div className="px-4 py-2 border-b border-[#E7DFD5] bg-[#FBF4E2] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1.5 text-xs text-[#8E6C0C]">
              <span>🏷️</span>
              <span className="text-[11px]">Use code <strong>FIRST10</strong> for 10% OFF</span>
            </div>
            <span className="text-[9px] font-mono font-bold uppercase bg-[#C59B27]/15 text-[#8E6C0C] px-1.5 py-0.5 rounded-md">
              VIP GIFT
            </span>
          </div>

          {/* 4. Main Scrollable Categories & Navigation Body */}
          <div className="flex-1 min-h-0 overflow-y-auto p-3.5 sm:p-4 space-y-3.5">
            
            {/* Curated Department Cards */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#787C87]">
                  Departments &amp; Catalog
                </span>
                <span className="text-[10px] font-mono text-[#C59B27] font-bold">
                  {categories.length} Collections
                </span>
              </div>

              {categories.map((cat) => {
                const hasChildren = (cat.children ?? []).length > 0;
                const isExpanded = expandedCat === cat.id;
                const icon = getCategoryIcon(cat.name);

                return (
                  <div
                    key={cat.id}
                    className="rounded-2xl bg-white border border-[#E7DFD5] overflow-hidden shadow-2xs transition-all duration-200"
                  >
                    {/* Department Header Row */}
                    <div className="flex items-center justify-between p-3 hover:bg-[#FAF8F5] transition-colors">
                      <Link
                        href={`/shop?category=${cat.slug}`}
                        onClick={onClose}
                        className="flex items-center gap-2 text-xs font-bold text-[#141416] hover:text-[#C59B27] transition-colors"
                      >
                        <span className="text-sm">{icon}</span>
                        <span>{cat.name}</span>
                      </Link>

                      {hasChildren ? (
                        <button
                          type="button"
                          onClick={() => setExpandedCat(isExpanded ? null : cat.id)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#FAF8F5] hover:bg-[#E7DFD5] border border-[#E7DFD5] text-[10px] font-bold text-[#787C87] hover:text-[#141416] transition-all cursor-pointer"
                        >
                          <span>{cat.children!.length}</span>
                          <span className="text-[9px] font-mono">{isExpanded ? "▲" : "▼"}</span>
                        </button>
                      ) : (
                        <Link
                          href={`/shop?category=${cat.slug}`}
                          onClick={onClose}
                          className="text-xs font-bold text-[#C59B27] px-1"
                        >
                          →
                        </Link>
                      )}
                    </div>

                    {/* Subcategories Pill List */}
                    {hasChildren && isExpanded && (
                      <div className="px-2.5 pb-2.5 pt-1 border-t border-[#E7DFD5]/60 bg-[#FAF8F5]/60 space-y-1 animate-in fade-in duration-150">
                        {cat.children!.map((sub) => (
                          <Link
                            key={sub.id}
                            href={`/shop?category=${sub.slug}`}
                            onClick={onClose}
                            className="flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium text-[#4B4E56] hover:text-[#C59B27] hover:bg-white transition-all group"
                          >
                            <span className="truncate">• {sub.name}</span>
                            <span className="text-[10px] text-[#C59B27] opacity-0 group-hover:opacity-100 transition-opacity">
                              →
                            </span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Featured Highlights & Quick Edits */}
            <div className="space-y-2 pt-1">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#787C87] px-1 block">
                Highlights &amp; Offers
              </span>

              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/shop?sort=newest"
                  onClick={onClose}
                  className="p-3 rounded-2xl bg-white border border-[#E7DFD5] hover:border-[#C59B27] text-xs font-bold text-[#141416] flex items-center justify-between shadow-2xs group transition-all"
                >
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#C59B27] pulse-dot" />
                    <span>New Drops</span>
                  </span>
                  <span className="text-[#C59B27] group-hover:translate-x-0.5 transition-transform">→</span>
                </Link>

                <Link
                  href="/shop?onSale=true"
                  onClick={onClose}
                  className="p-3 rounded-2xl bg-white border border-[#873E4C]/30 hover:border-[#873E4C] text-xs font-bold text-[#873E4C] flex items-center justify-between shadow-2xs group transition-all"
                >
                  <span className="flex items-center gap-1.5">
                    <span>🏷️</span>
                    <span>Super Deals</span>
                  </span>
                  <span className="text-[#873E4C] group-hover:translate-x-0.5 transition-transform">→</span>
                </Link>
              </div>

              <Link
                href="/categories"
                onClick={onClose}
                className="w-full p-3 rounded-2xl bg-gradient-to-r from-[#141416] to-[#25262B] text-white text-xs font-bold flex items-center justify-between shadow-xs mt-1.5"
              >
                <div className="flex items-center gap-2">
                  <span>🗂️</span>
                  <span>Explore Complete Category Hub</span>
                </div>
                <span className="text-[#C59B27]">→</span>
              </Link>
            </div>

            {/* Atelier Services & Concierge */}
            <div className="p-3.5 rounded-2xl bg-white border border-[#E7DFD5] space-y-2 shadow-2xs">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#787C87] block">
                Atelier Concierge
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
                <Link
                  href="/contact"
                  onClick={onClose}
                  className="flex items-center justify-between py-1 text-[#141416] hover:text-[#C59B27] transition-colors"
                >
                  <span>💬 WhatsApp Stylist Concierge</span>
                  <span>→</span>
                </Link>
              </div>
            </div>

          </div>

          {/* 5. Bottom Footer */}
          <div className="p-3.5 border-t border-[#E7DFD5] bg-white flex items-center justify-between text-xs text-[#787C87] shrink-0">
            <span className="text-[11px]">Fashion Cart Atelier · 2026</span>
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
