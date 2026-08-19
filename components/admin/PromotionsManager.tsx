"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useToast } from "@/components/providers/ToastProvider";
import { normalizeImageUrl } from "@/lib/utils/imageUrl";
import ProductImageLightbox from "@/components/products/ProductImageLightbox";

type Promotion = {
  id: string;
  title: string;
  subtitle?: string | null;
  badgeText?: string | null;
  imageUrl?: string | null;
  ctaText?: string | null;
  ctaUrl?: string | null;
  discountCode?: string | null;
  placement: "TOP_BANNER" | "POPUP_MODAL" | "HERO_SPOTLIGHT" | "FLOAT_SNACKBAR";
  theme: "FESTIVE_GOLD" | "ROYAL_RUBY" | "EMERALD_EID" | "SUNSET_ORANGE" | "MODERN_DARK";
  isActive: boolean;
  showOnLogin: boolean;
  showOnGuest: boolean;
  delayMinutes: number;
  sortOrder: number;
  startDate?: string | null;
  endDate?: string | null;
  createdAt: string;
};

const THEME_LABELS: Record<string, { label: string; bg: string; text: string; border: string }> = {
  FESTIVE_GOLD: { label: "Champagne Gold (Festive)", bg: "bg-[#141416]", text: "text-[#C59B27]", border: "border-[#C59B27]" },
  ROYAL_RUBY: { label: "Royal Ruby (Bridal / Wedding)", bg: "bg-[#4A0E17]", text: "text-rose-200", border: "border-rose-400" },
  EMERALD_EID: { label: "Emerald Eid (Festive Green)", bg: "bg-[#06281E]", text: "text-emerald-200", border: "border-emerald-400" },
  SUNSET_ORANGE: { label: "Sunset Orange (Summer / Holi)", bg: "bg-[#5C2406]", text: "text-amber-200", border: "border-amber-400" },
  MODERN_DARK: { label: "Modern Obsidian Noir", bg: "bg-[#1C1C1E]", text: "text-white", border: "border-white/30" },
};

const PLACEMENT_LABELS: Record<string, { label: string; icon: string }> = {
  TOP_BANNER: { label: "Top Announcement Bar", icon: "📢" },
  POPUP_MODAL: { label: "Login / Visitor Poster Popup Modal", icon: "🖼️" },
  HERO_SPOTLIGHT: { label: "Homepage Festive Spotlight Card", icon: "🌟" },
  FLOAT_SNACKBAR: { label: "Floating Bottom Offer Badge", icon: "🏷️" },
};

export default function PromotionsManager() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterPlacement, setFilterPlacement] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewLightbox, setPreviewLightbox] = useState<{
    isOpen: boolean;
    images: { imageUrl: string; altText?: string | null }[];
    productName: string;
  }>({
    isOpen: false,
    images: [],
    productName: "",
  });

  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formSubtitle, setFormSubtitle] = useState("");
  const [formBadgeText, setFormBadgeText] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formCtaText, setFormCtaText] = useState("Shop Now");
  const [formCtaUrl, setFormCtaUrl] = useState("/shop");
  const [formDiscountCode, setFormDiscountCode] = useState("");
  const [formPlacement, setFormPlacement] = useState<Promotion["placement"]>("TOP_BANNER");
  const [formTheme, setFormTheme] = useState<Promotion["theme"]>("FESTIVE_GOLD");
  const [formIsActive, setFormIsActive] = useState(true);
  const [formShowOnLogin, setFormShowOnLogin] = useState(false);
  const [formShowOnGuest, setFormShowOnGuest] = useState(true);
  const [formDelayMinutes, setFormDelayMinutes] = useState(0);
  const [formSortOrder, setFormSortOrder] = useState(0);

  const { success, error } = useToast();

  useEffect(() => {
    loadPromotions();
  }, []);

  async function loadPromotions() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/promotions");
      if (res.ok) {
        const data = await res.json();
        setPromotions(data.promotions || []);
      } else {
        error("Failed to load promotions");
      }
    } catch {
      error("Network error while loading promotions");
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingPromo(null);
    setFormTitle("");
    setFormSubtitle("");
    setFormBadgeText("FESTIVE OFFER");
    setFormImageUrl("");
    setFormCtaText("Shop Collection");
    setFormCtaUrl("/shop");
    setFormDiscountCode("");
    setFormPlacement("TOP_BANNER");
    setFormTheme("FESTIVE_GOLD");
    setFormIsActive(true);
    setFormShowOnLogin(false);
    setFormShowOnGuest(true);
    setFormDelayMinutes(0);
    setFormSortOrder(0);
    setIsModalOpen(true);
  }

  function openEditModal(promo: Promotion) {
    setEditingPromo(promo);
    setFormTitle(promo.title);
    setFormSubtitle(promo.subtitle || "");
    setFormBadgeText(promo.badgeText || "");
    setFormImageUrl(promo.imageUrl || "");
    setFormCtaText(promo.ctaText || "Shop Now");
    setFormCtaUrl(promo.ctaUrl || "/shop");
    setFormDiscountCode(promo.discountCode || "");
    setFormPlacement(promo.placement);
    setFormTheme(promo.theme);
    setFormIsActive(promo.isActive);
    setFormShowOnLogin(promo.showOnLogin);
    setFormShowOnGuest(promo.showOnGuest);
    setFormDelayMinutes(promo.delayMinutes || 0);
    setFormSortOrder(promo.sortOrder);
    setIsModalOpen(true);
  }

  async function handleToggleStatus(promo: Promotion) {
    const newStatus = !promo.isActive;
    try {
      const res = await fetch(`/api/admin/promotions/${promo.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newStatus }),
      });
      if (res.ok) {
        setPromotions((prev) =>
          prev.map((p) => (p.id === promo.id ? { ...p, isActive: newStatus } : p))
        );
        success(`Promotion ${newStatus ? "activated" : "deactivated"} successfully!`);
      } else {
        error("Failed to toggle status");
      }
    } catch {
      error("Network error updating promotion");
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Are you sure you want to permanently delete the promotion "${title}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/promotions/${id}`, { method: "DELETE" });
      if (res.ok) {
        setPromotions((prev) => prev.filter((p) => p.id !== id));
        success("Promotion deleted successfully!");
      } else {
        error("Failed to delete promotion");
      }
    } catch {
      error("Error deleting promotion");
    }
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      const src = event.target?.result as string;
      if (!src) {
        setUploadingImage(false);
        error("Failed to read image file");
        return;
      }

      // Automatically compress image if needed using HTML5 canvas
      const img = new (window as any).Image();
      img.src = src;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.85);
          setFormImageUrl(compressedDataUrl);
        } else {
          setFormImageUrl(src);
        }
        setUploadingImage(false);
        success("Poster Image Ready! 🖼️");
      };

      img.onerror = () => {
        setFormImageUrl(src);
        setUploadingImage(false);
        success("Poster Image Ready! 🖼️");
      };
    };

    reader.onerror = () => {
      setUploadingImage(false);
      error("Failed to read image file");
    };

    reader.readAsDataURL(file);
  }

  async function resolveImageUrl(rawUrl: string) {
    const trimmed = rawUrl.trim();
    if (!trimmed) return;

    const normalized = normalizeImageUrl(trimmed);
    if (normalized !== trimmed) {
      setFormImageUrl(normalized);
      return;
    }

    if (trimmed.includes("share.google") || trimmed.includes("google.com/imgres") || trimmed.includes("drive.google.com")) {
      try {
        const res = await fetch(`/api/admin/promotions/resolve-image?url=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.resolvedUrl && data.resolvedUrl !== trimmed) {
            setFormImageUrl(data.resolvedUrl);
          }
        }
      } catch {}
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formTitle.trim()) {
      error("Promotion title is required");
      return;
    }

    setSaving(true);
    let finalImageUrl = formImageUrl.trim();

    // Auto-resolve Google Image / Share links before saving
    if (finalImageUrl.includes("share.google") || finalImageUrl.includes("google.com/imgres")) {
      try {
        const res = await fetch(`/api/admin/promotions/resolve-image?url=${encodeURIComponent(finalImageUrl)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.resolvedUrl) {
            finalImageUrl = data.resolvedUrl;
          }
        }
      } catch {}
    }

    const payload = {
      title: formTitle,
      subtitle: formSubtitle,
      badgeText: formBadgeText,
      imageUrl: finalImageUrl,
      ctaText: formCtaText,
      ctaUrl: formCtaUrl,
      discountCode: formDiscountCode,
      placement: formPlacement,
      theme: formTheme,
      isActive: formIsActive,
      showOnLogin: formShowOnLogin,
      showOnGuest: formShowOnGuest,
      delayMinutes: formDelayMinutes,
      sortOrder: formSortOrder,
    };

    try {
      if (editingPromo) {
        const res = await fetch(`/api/admin/promotions/${editingPromo.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          success("Promotion updated successfully!");
          setIsModalOpen(false);
          loadPromotions();
        } else {
          error("Failed to update promotion");
        }
      } else {
        const res = await fetch("/api/admin/promotions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          success("New promotion created successfully!");
          setIsModalOpen(false);
          loadPromotions();
        } else {
          error("Failed to create promotion");
        }
      }
    } catch {
      error("Network error while saving promotion");
    } finally {
      setSaving(false);
    }
  }

  const filtered = promotions.filter((p) => {
    const matchSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.subtitle && p.subtitle.toLowerCase().includes(search.toLowerCase())) ||
      (p.discountCode && p.discountCode.toLowerCase().includes(search.toLowerCase())) ||
      (p.badgeText && p.badgeText.toLowerCase().includes(search.toLowerCase()));

    const matchPlacement = filterPlacement === "ALL" || p.placement === filterPlacement;
    const matchStatus =
      filterStatus === "ALL" ||
      (filterStatus === "ACTIVE" && p.isActive) ||
      (filterStatus === "INACTIVE" && !p.isActive);

    return matchSearch && matchPlacement && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E8E3D8] pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FBF4E2] border border-[#C59B27]/40 text-xs font-bold uppercase tracking-wider text-[#8E6C0C]">
            <span>✨ Festive Offers &amp; Marketing Engine</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0C3B2E] mt-1.5">
            Promotions &amp; Announcement Banners
          </h1>
          <p className="text-xs text-[#5B7A6F] mt-0.5">
            Manage top announcement bars, time-delayed login poster popups, discount flash banners, and customer reach.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#0C3B2E] text-white hover:bg-[#145241] transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>＋</span> Create Promotion
        </button>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="p-4 rounded-2xl bg-white border border-[#E8E3D8] shadow-2xs flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative min-w-[240px] flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">🔍</span>
          <input
            type="text"
            placeholder="Search promotion title, coupon code, badge…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#E8E3D8] text-xs outline-none focus:border-[#0C3B2E] bg-[#FAF8F5]"
          />
        </div>

        {/* Placement Filter */}
        <div className="flex items-center gap-2">
          <select
            value={filterPlacement}
            onChange={(e) => setFilterPlacement(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#E8E3D8] text-xs font-medium bg-[#FAF8F5] text-[#0C3B2E] outline-none"
          >
            <option value="ALL">All Placements (Top Bar, Popup, Hero)</option>
            <option value="TOP_BANNER">Top Announcement Bar</option>
            <option value="POPUP_MODAL">Login / Visitor Poster Popup Modal</option>
            <option value="HERO_SPOTLIGHT">Homepage Festive Spotlight Card</option>
            <option value="FLOAT_SNACKBAR">Floating Offer Badge</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#E8E3D8] text-xs font-medium bg-[#FAF8F5] text-[#0C3B2E] outline-none"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive / Paused</option>
          </select>
        </div>
      </div>

      {/* Promotions Grid / Cards */}
      {loading ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-[#E8E3D8] space-y-3">
          <span className="inline-block w-8 h-8 border-2 border-[#0C3B2E] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-[#5B7A6F] font-medium">Loading live promotions…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-[#E8E3D8] space-y-4 px-4">
          <div className="w-14 h-14 rounded-full bg-[#FAF8F5] border border-[#E8E3D8] flex items-center justify-center text-2xl mx-auto">
            🏷️
          </div>
          <div className="space-y-1">
            <h3 className="font-display text-base font-bold text-[#0C3B2E]">No promotions found</h3>
            <p className="text-xs text-[#5B7A6F] max-w-sm mx-auto">
              Create your first festive announcement, discount code banner, or time-delayed login poster popup.
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="px-5 py-2 rounded-full text-xs font-bold uppercase bg-[#0C3B2E] text-white hover:bg-[#145241] transition-all cursor-pointer"
          >
            Create New Promotion →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filtered.map((promo) => {
            const theme = THEME_LABELS[promo.theme] || THEME_LABELS.FESTIVE_GOLD;
            const placement = PLACEMENT_LABELS[promo.placement] || { label: promo.placement, icon: "📢" };
            const normalizedImg = normalizeImageUrl(promo.imageUrl);

            return (
              <div
                key={promo.id}
                className={`rounded-3xl border ${
                  promo.isActive ? "border-[#E8E3D8] bg-white" : "border-slate-200 bg-slate-50 opacity-75"
                } p-5 space-y-4 shadow-xs transition-all relative overflow-hidden flex flex-col justify-between`}
              >
                <div className="space-y-3">
                  {/* Top Meta Strip: Placement & Status Switch */}
                  <div className="flex items-center justify-between gap-2 border-b border-[#E8E3D8]/60 pb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FAF8F5] border border-[#E8E3D8] text-[#0C3B2E]">
                        <span>{placement.icon}</span>
                        <span>{placement.label}</span>
                      </span>

                      {promo.showOnLogin && promo.showOnGuest && (
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
                          👥 All Visitors
                        </span>
                      )}

                      {promo.showOnLogin && !promo.showOnGuest && (
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
                          👤 Logged In Only
                        </span>
                      )}

                      {!promo.showOnLogin && promo.showOnGuest && (
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-teal-100 text-teal-800 border border-teal-200">
                          🌐 Guests Only
                        </span>
                      )}

                      <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200">
                        ⏱️ {promo.delayMinutes > 0 ? `${promo.delayMinutes} min delay` : "⚡ Instant"}
                      </span>
                    </div>

                    {/* Interactive Active / Deactive Switch */}
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider ${promo.isActive ? "text-emerald-700" : "text-slate-400"}`}>
                        {promo.isActive ? "Active" : "Paused"}
                      </span>
                      <button
                        onClick={() => handleToggleStatus(promo)}
                        className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                          promo.isActive ? "bg-emerald-600" : "bg-slate-300"
                        }`}
                        title={promo.isActive ? "Click to Deactivate" : "Click to Activate"}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-xs ${
                            promo.isActive ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Visual Preview Box */}
                  <div className={`p-4 rounded-2xl ${theme.bg} ${theme.text} border ${theme.border} space-y-2 shadow-2xs relative overflow-hidden`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        {promo.badgeText && (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest bg-white/20 border border-white/30 text-white">
                            {promo.badgeText}
                          </span>
                        )}
                        <h4 className="font-display text-base font-bold text-white leading-tight">
                          {promo.title}
                        </h4>
                        {promo.subtitle && (
                          <p className="text-xs opacity-80 line-clamp-2 leading-relaxed">
                            {promo.subtitle}
                          </p>
                        )}
                      </div>

                      {normalizedImg && (
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewLightbox({
                              isOpen: true,
                              images: [{ imageUrl: normalizedImg, altText: promo.title }],
                              productName: promo.title,
                            })
                          }
                          className="relative h-16 w-16 rounded-xl overflow-hidden shrink-0 border border-white/20 bg-black/40 group cursor-pointer"
                          title="Click for full-screen High Definition Detail Preview"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={normalizedImg}
                            alt="Promo graphic"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[9px] font-extrabold tracking-wider">
                            🔍 HD
                          </div>
                        </button>
                      )}
                    </div>

                    {/* Code & CTA Preview */}
                    <div className="pt-2 border-t border-white/15 flex flex-wrap items-center justify-between gap-2 text-xs">
                      {promo.discountCode ? (
                        <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded bg-white text-[#141416] tracking-wider">
                          🎟️ {promo.discountCode}
                        </span>
                      ) : (
                        <span className="text-[10px] opacity-70">No coupon code required</span>
                      )}

                      <span className="text-[11px] font-bold underline opacity-90">
                        {promo.ctaText || "Shop Now"} →
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="pt-3 border-t border-[#E8E3D8]/60 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-[#5B7A6F]">
                    Theme: <strong>{theme.label.split(" ")[0]}</strong> · Order #{promo.sortOrder}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(promo)}
                      className="px-3 py-1.5 rounded-xl font-bold text-xs text-[#0C3B2E] bg-[#F2EFE8] hover:bg-[#E8E3D8] transition-colors cursor-pointer"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(promo.id, promo.title)}
                      className="px-3 py-1.5 rounded-xl font-bold text-xs text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal Dialog */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-[#E8E3D8] shadow-2xl p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-200 my-8">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#E8E3D8] pb-4">
              <div>
                <h3 className="font-display text-xl font-bold text-[#0C3B2E]">
                  {editingPromo ? "Edit Promotion & Banner" : "Create New Promotion"}
                </h3>
                <p className="text-xs text-[#5B7A6F]">
                  Configure banner copy, time-delayed login poster, discount code, and display placements.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#FAF8F5] border border-[#E8E3D8] text-[#0C3B2E] flex items-center justify-center font-bold hover:bg-[#E8E3D8] transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              
              {/* Title & Badge */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="font-bold text-[#0C3B2E] block">Promotion Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Grand Festive Gala Sale — Flat 25% OFF"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E3D8] outline-none focus:border-[#0C3B2E] bg-[#FAF8F5]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#0C3B2E] block">Badge Text (Short)</label>
                  <input
                    type="text"
                    placeholder="e.g. FESTIVE OFFER"
                    value={formBadgeText}
                    onChange={(e) => setFormBadgeText(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E3D8] outline-none focus:border-[#0C3B2E] bg-[#FAF8F5] uppercase"
                  />
                </div>
              </div>

              {/* Subtitle */}
              <div className="space-y-1">
                <label className="font-bold text-[#0C3B2E] block">Subtitle / Description</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Explore certified mulberry silk sarees, French linen shirts, and festive bespoke edits."
                  value={formSubtitle}
                  onChange={(e) => setFormSubtitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E8E3D8] outline-none focus:border-[#0C3B2E] bg-[#FAF8F5] resize-none"
                />
              </div>

              {/* Placement & Theme */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[#0C3B2E] block">Display Placement</label>
                  <select
                    value={formPlacement}
                    onChange={(e) => setFormPlacement(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E3D8] outline-none focus:border-[#0C3B2E] bg-[#FAF8F5] font-medium"
                  >
                    <option value="TOP_BANNER">Top Announcement Bar</option>
                    <option value="POPUP_MODAL">Login / Visitor Poster Popup Modal</option>
                    <option value="HERO_SPOTLIGHT">Homepage Festive Spotlight Card</option>
                    <option value="FLOAT_SNACKBAR">Floating Bottom Offer Badge</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#0C3B2E] block">Festive Color Theme</label>
                  <select
                    value={formTheme}
                    onChange={(e) => setFormTheme(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E3D8] outline-none focus:border-[#0C3B2E] bg-[#FAF8F5] font-medium"
                  >
                    <option value="FESTIVE_GOLD">Champagne Gold (Festive &amp; Luxury)</option>
                    <option value="ROYAL_RUBY">Royal Ruby (Bridal / Wedding Season)</option>
                    <option value="EMERALD_EID">Emerald Eid (Regal Green &amp; Silver)</option>
                    <option value="SUNSET_ORANGE">Sunset Orange (Summer / Holi)</option>
                    <option value="MODERN_DARK">Modern Obsidian Noir</option>
                  </select>
                </div>
              </div>

              {/* Image URL & Direct File Upload */}
              <div className="space-y-2 p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E3D8]">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[#0C3B2E] block text-xs">
                    Promotional Poster Image (Supports Google Drive / Share links, URLs &amp; Uploads)
                  </label>
                  <label className="px-3 py-1 rounded-xl bg-white border border-[#E8E3D8] hover:border-[#0C3B2E] text-[11px] font-bold text-[#0C3B2E] cursor-pointer shadow-2xs">
                    <span>{uploadingImage ? "Processing…" : "📁 Upload Image File"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                    />
                  </label>
                </div>

                <input
                  type="text"
                  placeholder="Paste any image URL or Google Drive link (e.g. https://... or /uploads/...)"
                  value={formImageUrl}
                  onChange={(e) => {
                    setFormImageUrl(e.target.value);
                    resolveImageUrl(e.target.value);
                  }}
                  onBlur={(e) => resolveImageUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E8E3D8] outline-none focus:border-[#0C3B2E] bg-white text-xs"
                />

                {/* Live Image Preview Box */}
                {formImageUrl && (
                  <div className="pt-2 flex items-center gap-3 bg-white p-2.5 rounded-xl border border-[#E8E3D8]">
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewLightbox({
                          isOpen: true,
                          images: [{ imageUrl: normalizeImageUrl(formImageUrl), altText: formTitle || "Promotion Preview" }],
                          productName: formTitle || "Promotional Poster Detail Preview",
                        })
                      }
                      className="relative w-24 h-16 rounded-lg overflow-hidden border border-[#E8E3D8] bg-slate-100 shrink-0 shadow-2xs group cursor-pointer"
                      title="Click for full-screen High Definition Detail Preview"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        key={formImageUrl}
                        src={normalizeImageUrl(formImageUrl)}
                        alt="Preview"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          (e.target as HTMLElement).style.opacity = "0.4";
                        }}
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-extrabold tracking-wider">
                        🔍 ZOOM
                      </div>
                    </button>
                    <div className="text-[10px] text-[#5B7A6F] leading-tight flex-1 min-w-0">
                      <p className="font-bold text-[#0C3B2E]">✓ Image Connected &amp; Ready (Click image for HD Zoom)</p>
                      <p className="truncate opacity-80">{formImageUrl.startsWith("data:") ? "Direct Image File Uploaded" : formImageUrl}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Time-Delayed Display Timing & Control (Always Visible) */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[#0C3B2E] block text-xs">
                    ⏱️ Promotion Display Timing &amp; Delay (Minutes after Login / Visit)
                  </label>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-amber-200/60 text-amber-900">
                    {formPlacement === "POPUP_MODAL" ? "🖼️ Controls Popup Poster Timing" : "📢 Controls Announcement Timing"}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    max="120"
                    value={formDelayMinutes}
                    onChange={(e) => setFormDelayMinutes(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-24 px-3 py-2 rounded-xl border border-amber-300 outline-none focus:border-[#0C3B2E] bg-white font-black text-sm"
                  />

                  {/* Quick Preset Buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      { label: "⚡ Instant (0m)", val: 0 },
                      { label: "1 min", val: 1 },
                      { label: "2 mins", val: 2 },
                      { label: "3 mins", val: 3 },
                      { label: "5 mins", val: 5 },
                      { label: "10 mins", val: 10 },
                    ].map((preset) => (
                      <button
                        type="button"
                        key={preset.val}
                        onClick={() => setFormDelayMinutes(preset.val)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          formDelayMinutes === preset.val
                            ? "bg-[#0C3B2E] text-white shadow-xs"
                            : "bg-white border border-amber-300/80 text-[#0C3B2E] hover:bg-amber-100"
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <p className="text-[11px] text-[#5B7A6F] leading-tight">
                  {formDelayMinutes === 0
                    ? "⚡ Instant Delivery: Promotion appears immediately (1-2 seconds after login / page visit)."
                    : `⏱️ Time-Delayed Delivery: Promotion will wait and popup precisely after the customer has spent ${formDelayMinutes} minute${formDelayMinutes > 1 ? "s" : ""} browsing.`}
                </p>
              </div>

              {/* Coupon Code, CTA Text & CTA URL */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[#0C3B2E] block">Promo Coupon Code</label>
                  <input
                    type="text"
                    placeholder="e.g. FESTIVE20"
                    value={formDiscountCode}
                    onChange={(e) => setFormDiscountCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E3D8] outline-none focus:border-[#0C3B2E] bg-[#FAF8F5] font-mono uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#0C3B2E] block">Button Text</label>
                  <input
                    type="text"
                    placeholder="Shop Collection"
                    value={formCtaText}
                    onChange={(e) => setFormCtaText(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E3D8] outline-none focus:border-[#0C3B2E] bg-[#FAF8F5]"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-[#0C3B2E] block">Target Destination URL / Promoted Product *</label>
                    <span className="text-[10px] text-[#5B7A6F]">Clicking poster opens this</span>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. /shop or /products/slug-name"
                    value={formCtaUrl}
                    onChange={(e) => setFormCtaUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E3D8] outline-none focus:border-[#0C3B2E] bg-[#FAF8F5]"
                  />
                  {/* Quick destination presets */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {[
                      { label: "All Shop", url: "/shop" },
                      { label: "New Arrivals", url: "/shop?sort=newest" },
                      { label: "Festive Saree", url: "/products/tussar-silk-hand-block-printed-saree" },
                      { label: "Organza Silk", url: "/products/zari-woven-organza-silk-saree-scalloped" },
                      { label: "Kurta Set", url: "/products/georgette-chikankari-embroidered-straight-kurta-set" },
                      { label: "Nehru Jacket", url: "/products/raw-silk-blend-bandhgala-nehru-jacket" },
                    ].map((dest) => (
                      <button
                        type="button"
                        key={dest.url}
                        onClick={() => setFormCtaUrl(dest.url)}
                        className={`text-[10px] px-2 py-0.5 rounded-md border font-medium transition-colors cursor-pointer ${
                          formCtaUrl === dest.url
                            ? "bg-[#0C3B2E] text-white border-[#0C3B2E]"
                            : "bg-white border-[#E8E3D8] text-[#5B7A6F] hover:border-[#0C3B2E]"
                        }`}
                      >
                        {dest.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Target Audience & Event Triggers */}
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E3D8] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[#0C3B2E] block text-xs">
                    🎯 Target Audience &amp; Event Trigger
                  </label>
                  <span className="text-[10px] text-[#5B7A6F]">Controls who sees this promotion</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    {
                      label: "👥 All Visitors",
                      desc: "Guests & Logged-in Customers",
                      guest: true,
                      login: true,
                    },
                    {
                      label: "👤 Logged-in Only",
                      desc: "Appears upon / after login",
                      guest: false,
                      login: true,
                    },
                    {
                      label: "🌐 Guests Only",
                      desc: "Pre-login visitors without account",
                      guest: true,
                      login: false,
                    },
                  ].map((aud) => {
                    const isSelected = formShowOnGuest === aud.guest && formShowOnLogin === aud.login;
                    return (
                      <button
                        type="button"
                        key={aud.label}
                        onClick={() => {
                          setFormShowOnGuest(aud.guest);
                          setFormShowOnLogin(aud.login);
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? "border-[#0C3B2E] bg-white shadow-xs ring-1 ring-[#0C3B2E]"
                            : "border-[#E8E3D8] bg-[#FAF8F5] hover:bg-white"
                        }`}
                      >
                        <p className={`font-bold text-xs ${isSelected ? "text-[#0C3B2E]" : "text-slate-700"}`}>{aud.label}</p>
                        <p className="text-[10px] text-[#5B7A6F] mt-0.5 leading-tight">{aud.desc}</p>
                      </button>
                    );
                  })}
                </div>

                <label className="flex items-center gap-2 cursor-pointer font-medium text-[#0C3B2E] pt-1">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-[#0C3B2E] accent-[#0C3B2E]"
                  />
                  <span className="font-bold text-xs">Promotion Status: Active (Live on Storefront)</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[#E8E3D8] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-full font-bold text-[#5B7A6F] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingImage}
                  className="px-6 py-2.5 rounded-full font-bold uppercase tracking-wider bg-[#0C3B2E] text-white hover:bg-[#145241] transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Saving…" : editingPromo ? "Update Promotion" : "Publish Promotion"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* High-Definition Luxury Image Preview Lightbox */}
      <ProductImageLightbox
        isOpen={previewLightbox.isOpen}
        images={previewLightbox.images}
        productName={previewLightbox.productName}
        onClose={() => setPreviewLightbox({ isOpen: false, images: [], productName: "" })}
      />
    </div>
  );
}
