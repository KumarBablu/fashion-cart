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
  categories = [],
}: {
  isOpen: boolean;
  onClose: () => void;
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

  if (!isOpen || !mounted) return null;

  const drawerContent = (
    <div
      className="fixed inset-0 z-[999999] overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Department Catalog & Navigation Menu"
    >
      {/* Darkened Backdrop Overlay with Subtle Blur */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-[#141416]/65 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
      />

      {/* Slide-in Full-Height Luxury Drawer Panel from Left */}
      <div className="fixed inset-y-0 left-0 max-w-full flex pr-4 sm:pr-10">
        <aside className="w-screen max-w-md h-full bg-[#FAF8F5] text-[#141416] shadow-2xl border-r border-[#E7DFD5] flex flex-col justify-between transition-transform duration-300 ease-out animate-in slide-in-from-left">
          
          {/* 1. Header Section */}
          <div className="p-4 sm:p-5 border-b border-[#E7DFD5] bg-white flex items-center justify-between shrink-0 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="relative h-9 w-9 shrink-0">
                <Image
                  src="/fashion-cart-logo-transparent.svg"
                  alt="Fashion Cart Luxury Monogram"
                  fill
                  sizes="36px"
                  className="object-contain"
                />
              </div>
              <div>
                <h2 className="font-display text-lg font-black text-[#141416] tracking-tight leading-none">
                  Fashion Cart
                </h2>
                <p className="text-[10px] text-[#C59B27] uppercase tracking-[0.2em] font-bold mt-0.5">
                  Luxury Atelier &amp; Apparel
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full border border-[#E7DFD5] bg-[#FAF8F5] hover:bg-[#E7DFD5] text-[#141416] flex items-center justify-center transition-all cursor-pointer shadow-xs font-bold"
              aria-label="Close menu drawer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* 2. VIP Welcome Privilege Banner */}
          <div className="px-5 py-3 border-b border-[#E7DFD5] bg-[#FBF4E2] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-xs text-[#8E6C0C]">
              <span>🏷️</span>
              <span>Use code <strong>FIRST10</strong> for 10% OFF</span>
            </div>
            <span className="text-[10px] font-mono font-bold uppercase bg-[#C59B27]/15 text-[#8E6C0C] px-2 py-0.5 rounded-md">
              VIP GIFT
            </span>
          </div>

          {/* 3. Main Scrollable Categories & Links Body */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4">
            
            {/* Curated Department Cards */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#787C87]">
                  Curated Departments
                </span>
                <span className="text-[10px] font-mono text-[#C59B27] font-bold">
                  {categories.length} Collections
                </span>
              </div>

              {categories.map((cat) => {
                const hasChildren = (cat.children ?? []).length > 0;
                const isExpanded = expandedCat === cat.id;

                return (
                  <div
                    key={cat.id}
                    className="rounded-2xl bg-white border border-[#E7DFD5] overflow-hidden shadow-2xs transition-all duration-200"
                  >
                    {/* Department Header Row */}
                    <div className="flex items-center justify-between p-3.5 hover:bg-[#FAF8F5] transition-colors">
                      <Link
                        href={`/shop?category=${cat.slug}`}
                        onClick={onClose}
                        className="flex items-center gap-2 text-xs font-bold text-[#141416] hover:text-[#C59B27] transition-colors"
                      >
                        <span className="text-sm">✨</span>
                        <span>{cat.name}</span>
                      </Link>

                      {hasChildren ? (
                        <button
                          type="button"
                          onClick={() => setExpandedCat(isExpanded ? null : cat.id)}
                          className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#FAF8F5] hover:bg-[#E7DFD5] border border-[#E7DFD5] text-[10px] font-bold text-[#787C87] hover:text-[#141416] transition-all cursor-pointer"
                        >
                          <span>{cat.children!.length} subcategories</span>
                          <span className="text-[9px]">{isExpanded ? "▲" : "▼"}</span>
                        </button>
                      ) : (
                        <Link
                          href={`/shop?category=${cat.slug}`}
                          onClick={onClose}
                          className="text-xs font-bold text-[#C59B27]"
                        >
                          →
                        </Link>
                      )}
                    </div>

                    {/* Subcategories Pill List */}
                    {hasChildren && (
                      <div className={`px-3 pb-3 pt-1 border-t border-[#E7DFD5]/60 bg-[#FAF8F5]/60 space-y-1 ${isExpanded ? "block" : "hidden sm:block"}`}>
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

            {/* Featured Highlight Cards */}
            <div className="space-y-2 pt-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#787C87] px-1 block">
                Highlights &amp; Offers
              </span>

              <div className="grid grid-cols-2 gap-2.5">
                <Link
                  href="/shop?sort=newest"
                  onClick={onClose}
                  className="p-3.5 rounded-2xl bg-white border border-[#E7DFD5] hover:border-[#C59B27] text-xs font-bold text-[#141416] flex items-center justify-between shadow-2xs group transition-all"
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
                  className="p-3.5 rounded-2xl bg-white border border-[#873E4C]/30 hover:border-[#873E4C] text-xs font-bold text-[#873E4C] flex items-center justify-between shadow-2xs group transition-all"
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
                className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-[#141416] to-[#25262B] text-white text-xs font-bold flex items-center justify-between shadow-xs mt-2"
              >
                <div className="flex items-center gap-2">
                  <span>🗂️</span>
                  <span>Explore Complete Category Hub</span>
                </div>
                <span className="text-[#C59B27]">→</span>
              </Link>
            </div>

            {/* Concierge & Support Quick Links */}
            <div className="p-4 rounded-2xl bg-white border border-[#E7DFD5] space-y-2.5 shadow-2xs">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#787C87] block">
                Atelier Services
              </span>
              <div className="space-y-1.5 text-xs font-semibold">
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
                  <span>💬 WhatsApp Stylist &amp; Concierge</span>
                  <span>→</span>
                </Link>
              </div>
            </div>

          </div>

          {/* 4. Bottom Footer */}
          <div className="p-4 border-t border-[#E7DFD5] bg-white flex items-center justify-between text-xs text-[#787C87] shrink-0">
            <span>Fashion Cart Atelier · 2026</span>
            <Link
              href="/contact"
              onClick={onClose}
              className="font-bold text-[#141416] hover:text-[#C59B27] hover:underline"
            >
              Need Help? Contact Us →
            </Link>
          </div>

        </aside>
      </div>
    </div>
  );

  return createPortal(drawerContent, document.body);
}
