"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/components/providers/ToastProvider";
import { normalizeImageUrl } from "@/lib/utils/imageUrl";

export type BannerItem = {
  id: string;
  title: string;
  subtitle?: string | null;
  badge?: string | null;
  linkUrl?: string | null;
  imageUrl?: string | null;
  buttonText?: string | null;
  position: string; // "HERO", "OCCASION", "PROMO_BAR"
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
};

export type PromotionItem = {
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
  const searchParams = useSearchParams();
  const [activeStore, setActiveStore] = useState<string>("garments");
  const [activeTab, setActiveTab] = useState<"OCCASIONS" | "HERO" | "PROMOTIONS">("OCCASIONS");
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [promotions, setPromotions] = useState<PromotionItem[]>([]);
  const [storeProducts, setStoreProducts] = useState<any[]>([]);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [showPromoProductPicker, setShowPromoProductPicker] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const { success, error } = useToast();

  const loadAllData = useCallback(async (storeToLoad?: string) => {
    const currentStore = storeToLoad || activeStore;
    setLoading(true);
    try {
      const [bRes, pRes, prodRes] = await Promise.all([
        fetch(`/api/admin/banners?store=${currentStore}`),
        fetch(`/api/admin/promotions?store=${currentStore}`),
        fetch(`/api/products?store=${currentStore}&pageSize=100`),
      ]);

      if (bRes.ok) {
        const bData = await bRes.json();
        setBanners(bData.banners || []);
      }
      if (pRes.ok) {
        const pData = await pRes.json();
        setPromotions(pData.promotions || []);
      }
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setStoreProducts(prodData.products || []);
      }
    } catch {
      error("Network error while loading marketing settings");
    } finally {
      setLoading(false);
    }
  }, [activeStore, error]);

  useEffect(() => {
    const fromUrl = searchParams.get("store");
    if (fromUrl) {
      setActiveStore(fromUrl);
      loadAllData(fromUrl);
      return;
    }

    const match = typeof document !== "undefined" ? document.cookie.match(/(?:^|;\s*)fc_admin_store=([^;]+)/) : null;
    if (match && match[1]) {
      setActiveStore(match[1]);
      loadAllData(match[1]);
    } else {
      loadAllData("garments");
    }
  }, [searchParams, loadAllData]);

  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerItem | null>(null);
  const [bannerForm, setBannerForm] = useState({
    title: "",
    subtitle: "",
    badge: "",
    linkUrl: "/shop",
    imageUrl: "",
    buttonText: "Explore Outfits",
    position: "OCCASION",
    isActive: true,
    sortOrder: 0,
  });

  // Promo Modal State
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromotionItem | null>(null);
  const [promoForm, setPromoForm] = useState({
    title: "",
    subtitle: "",
    badgeText: "FESTIVE OFFER",
    imageUrl: "",
    ctaText: "Shop Collection",
    ctaUrl: "/shop",
    discountCode: "",
    placement: "TOP_BANNER" as PromotionItem["placement"],
    theme: "FESTIVE_GOLD" as PromotionItem["theme"],
    isActive: true,
    showOnLogin: false,
    showOnGuest: true,
    delayMinutes: 0,
    sortOrder: 0,
  });

  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const occasions = banners.filter((b) => b.position === "OCCASION");
  const heroes = banners.filter((b) => b.position === "HERO");

  function handleSelectProductForBanner(product: any) {
    const price = product.variants?.[0]?.price
      ? `₹${Number(product.variants[0].price).toLocaleString("en-IN")}`
      : "";
    const img = product.images?.[0]?.imageUrl || "";
    const storeQuery = activeStore === "jewellery" ? "?store=jewellery" : "";

    setBannerForm((prev) => ({
      ...prev,
      title: product.name,
      subtitle: product.description ? product.description.slice(0, 120) : `${price} · In Stock · Certified Luxury`,
      badge: product.category?.name || "👑 Featured Drop",
      imageUrl: img,
      linkUrl: `/products/${product.slug}${storeQuery}`,
      buttonText: activeStore === "jewellery" ? "View Featured Jewellery →" : "Explore Collection →",
    }));
    setShowProductPicker(false);
    success("Product Selected 🎉", `Auto-filled banner with "${product.name}"`);
  }

  function openCreateBannerModal(position: "OCCASION" | "HERO") {
    setEditingBanner(null);
    setBannerForm({
      title: position === "OCCASION" ? "Festive Royal Silk Edit" : "Timeless Elegance. Effortless Style.",
      subtitle: position === "OCCASION" ? "Handwoven Varanasi Sarees & Kurtis" : "Discover masterfully tailored garments...",
      badge: position === "OCCASION" ? "Artisanal Craft" : "The 2026 Signature Luxury Edit",
      linkUrl: "/shop",
      imageUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80",
      buttonText: position === "OCCASION" ? "Explore Outfits" : "Explore New Season →",
      position,
      isActive: true,
      sortOrder: (position === "OCCASION" ? occasions.length : heroes.length) + 1,
    });
    setIsBannerModalOpen(true);
  }

  function openEditBannerModal(banner: BannerItem) {
    setEditingBanner(banner);
    setBannerForm({
      title: banner.title,
      subtitle: banner.subtitle || "",
      badge: banner.badge || "",
      linkUrl: banner.linkUrl || "/shop",
      imageUrl: banner.imageUrl || "",
      buttonText: banner.buttonText || "Shop Now",
      position: banner.position,
      isActive: banner.isActive,
      sortOrder: banner.sortOrder,
    });
    setIsBannerModalOpen(true);
  }

  async function handleSaveBanner(e: React.FormEvent) {
    e.preventDefault();
    if (!bannerForm.title.trim()) {
      error("Please enter a title");
      return;
    }

    setSaving(true);
    try {
      const url = editingBanner ? `/api/admin/banners/${editingBanner.id}?store=${activeStore}` : `/api/admin/banners?store=${activeStore}`;
      const method = editingBanner ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bannerForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save banner");

      success("Saved Successfully 🎉", data.message || "Updated banner settings");
      setIsBannerModalOpen(false);
      loadAllData();
    } catch (err: any) {
      error(err.message || "Error saving banner");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleBannerStatus(banner: BannerItem) {
    try {
      const res = await fetch(`/api/admin/banners/${banner.id}?store=${activeStore}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !banner.isActive }),
      });
      if (res.ok) {
        setBanners((prev) =>
          prev.map((b) => (b.id === banner.id ? { ...b, isActive: !banner.isActive } : b))
        );
        success("Status Updated", `Item is now ${!banner.isActive ? "Active" : "Hidden"}`);
      }
    } catch {
      error("Failed to update status");
    }
  }

  async function handleDeleteBanner(id: string, title: string) {
    if (!confirm(`Permanently delete "${title}"?`)) return;
    try {
      const res = await fetch(`/api/admin/banners/${id}?store=${activeStore}`, { method: "DELETE" });
      if (res.ok) {
        setBanners((prev) => prev.filter((b) => b.id !== id));
        success("Deleted", `Removed "${title}"`);
      }
    } catch {
      error("Failed to delete banner");
    }
  }

  // ===================== PROMOTION ACTIONS =====================

  function handleSelectProductForPromo(product: any) {
    const price = product.variants?.[0]?.price
      ? `₹${Number(product.variants[0].price).toLocaleString("en-IN")}`
      : "";
    const img = product.images?.[0]?.imageUrl || "";
    const storeQuery = activeStore === "jewellery" ? "?store=jewellery" : "";

    setPromoForm((prev) => ({
      ...prev,
      title: product.name,
      subtitle: product.description ? product.description.slice(0, 120) : `${price} · In Stock · Certified Luxury`,
      badgeText: product.category?.name || "SPECIAL OFFER",
      imageUrl: img,
      ctaUrl: `/products/${product.slug}${storeQuery}`,
      ctaText: "Shop Product →",
    }));
    setShowPromoProductPicker(false);
    success("Product Selected 🎉", `Auto-filled promotion with "${product.name}"`);
  }

  function openCreatePromoModal() {
    setEditingPromo(null);
    setPromoForm({
      title: "",
      subtitle: "",
      badgeText: "FESTIVE OFFER",
      imageUrl: "",
      ctaText: "Shop Collection",
      ctaUrl: "/shop",
      discountCode: "",
      placement: "TOP_BANNER",
      theme: "FESTIVE_GOLD",
      isActive: true,
      showOnLogin: false,
      showOnGuest: true,
      delayMinutes: 0,
      sortOrder: promotions.length + 1,
    });
    setIsPromoModalOpen(true);
  }

  function openEditPromoModal(promo: PromotionItem) {
    setEditingPromo(promo);
    setPromoForm({
      title: promo.title,
      subtitle: promo.subtitle || "",
      badgeText: promo.badgeText || "",
      imageUrl: promo.imageUrl || "",
      ctaText: promo.ctaText || "Shop Now",
      ctaUrl: promo.ctaUrl || "/shop",
      discountCode: promo.discountCode || "",
      placement: promo.placement,
      theme: promo.theme,
      isActive: promo.isActive,
      showOnLogin: promo.showOnLogin,
      showOnGuest: promo.showOnGuest,
      delayMinutes: promo.delayMinutes,
      sortOrder: promo.sortOrder,
    });
    setIsPromoModalOpen(true);
  }

  async function handleSavePromo(e: React.FormEvent) {
    e.preventDefault();
    if (!promoForm.title.trim()) {
      error("Please enter a title");
      return;
    }

    setSaving(true);
    try {
      const url = editingPromo ? `/api/admin/promotions/${editingPromo.id}` : "/api/admin/promotions";
      const method = editingPromo ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(promoForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save promotion");

      success("Saved Successfully 🎉", "Promotion updated");
      setIsPromoModalOpen(false);
      loadAllData();
    } catch (err: any) {
      error(err.message || "Error saving promotion");
    } finally {
      setSaving(false);
    }
  }

  async function handleTogglePromoStatus(promo: PromotionItem) {
    try {
      const res = await fetch(`/api/admin/promotions/${promo.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !promo.isActive }),
      });
      if (res.ok) {
        setPromotions((prev) =>
          prev.map((p) => (p.id === promo.id ? { ...p, isActive: !promo.isActive } : p))
        );
        success("Status Updated", `Promotion is now ${!promo.isActive ? "Active" : "Hidden"}`);
      }
    } catch {
      error("Failed to update status");
    }
  }

  async function handleDeletePromo(id: string, title: string) {
    if (!confirm(`Permanently delete "${title}"?`)) return;
    try {
      const res = await fetch(`/api/admin/promotions/${id}`, { method: "DELETE" });
      if (res.ok) {
        setPromotions((prev) => prev.filter((p) => p.id !== id));
        success("Deleted", `Removed "${title}"`);
      }
    } catch {
      error("Failed to delete promotion");
    }
  }

  // Upload handler for banner image with instant client-side preview & serverless fallback
  async function handleBannerFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      error("Image file is too large. Please select an image under 5MB.");
      return;
    }

    setUploadingImage(true);

    // Read immediately via FileReader for 0ms instant preview
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setBannerForm((prev) => ({ ...prev, imageUrl: dataUrl }));
      }
    };
    reader.readAsDataURL(file);

    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await fetch("/api/admin/promotions/upload", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setBannerForm((prev) => ({ ...prev, imageUrl: data.url }));
        success("Image Uploaded 🎉", "New lookbook image ready!");
      } else {
        success("Image Loaded 🎉", "Image loaded from device!");
      }
    } catch {
      success("Image Loaded 🎉", "Image loaded from device!");
    } finally {
      setUploadingImage(false);
    }
  }

  // Upload handler for promotion poster/image with instant client-side preview & serverless fallback
  async function handlePromoFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      error("Image file is too large. Please select an image under 5MB.");
      return;
    }

    setUploadingImage(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setPromoForm((prev) => ({ ...prev, imageUrl: dataUrl }));
      }
    };
    reader.readAsDataURL(file);

    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await fetch("/api/admin/promotions/upload", {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setPromoForm((prev) => ({ ...prev, imageUrl: data.url }));
        success("Poster Image Uploaded 🎉", "Promotional image ready!");
      } else {
        success("Image Loaded 🎉", "Image loaded from device!");
      }
    } catch {
      success("Image Loaded 🎉", "Image loaded from device!");
    } finally {
      setUploadingImage(false);
    }
  }

  return (
    <div className="h-full flex flex-col min-h-0 space-y-6">
      {/* Top Header */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">✨</span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Homepage, Hero &amp; Occasions Studio
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Dedicated visual control for Hero lookbook models, Shop by Occasion curation, and festive banners.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "OCCASIONS" && (
            <button
              onClick={() => openCreateBannerModal("OCCASION")}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#C59B27] hover:bg-[#B0881E] text-white transition-colors flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <span>+</span> Add New Occasion
            </button>
          )}
          {activeTab === "HERO" && (
            <button
              onClick={() => openCreateBannerModal("HERO")}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#141416] hover:bg-neutral-800 text-white transition-colors flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <span>+</span> Create Hero Slide
            </button>
          )}
          {activeTab === "PROMOTIONS" && (
            <button
              onClick={openCreatePromoModal}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#C59B27] hover:bg-[#B0881E] text-white transition-colors flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <span>+</span> Create Announcement / Popup
            </button>
          )}
        </div>
      </div>

      {/* Main Studio Tabs */}
      <div className="shrink-0 flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab("OCCASIONS")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "OCCASIONS"
              ? "bg-[#141416] text-white shadow-md"
              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <span>👗</span>
          <span>Shop by Occasion</span>
          <span className="px-2 py-0.2 rounded-full text-[10px] bg-white/20 text-white font-mono">
            {occasions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("HERO")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "HERO"
              ? "bg-[#141416] text-white shadow-md"
              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <span>🌟</span>
          <span>Hero Banners &amp; Lookbook</span>
          <span className="px-2 py-0.2 rounded-full text-[10px] bg-white/20 text-white font-mono">
            {heroes.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("PROMOTIONS")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "PROMOTIONS"
              ? "bg-[#141416] text-white shadow-md"
              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <span>📢</span>
          <span>Top Banners &amp; Popup Modals</span>
          <span className="px-2 py-0.2 rounded-full text-[10px] bg-white/20 text-white font-mono">
            {promotions.length}
          </span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto min-h-0 pb-12">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#C59B27] border-t-transparent" />
            <p className="text-xs text-slate-500 font-semibold">Loading marketing assets studio…</p>
          </div>
        ) : activeTab === "OCCASIONS" ? (
          /* ========================================================
             TAB 1: SHOP BY OCCASION MANAGER
             ======================================================== */
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
              <span className="text-lg">💡</span>
              <div>
                <p className="font-bold">Live Homepage Curation</p>
                <p className="text-amber-800/80 mt-0.5">
                  The cards below are rendered directly in the <strong>&quot;Shop by Occasion&quot;</strong> section on your homepage. You can update any card&apos;s photo, titles, badge tags, and target collection links anytime.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {occasions.map((occ) => (
                <div
                  key={occ.id}
                  className={`rounded-3xl border overflow-hidden flex flex-col justify-between transition-all bg-white shadow-sm hover:shadow-md ${
                    occ.isActive ? "border-slate-200" : "border-rose-200 opacity-60"
                  }`}
                >
                  {/* Visual Occasion Card Preview */}
                  <div className="relative aspect-[4/5] w-full bg-[#141416] p-5 flex flex-col justify-end overflow-hidden">
                    {occ.imageUrl ? (
                      <Image
                        src={occ.imageUrl}
                        alt={occ.title}
                        fill
                        sizes="300px"
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-slate-400">
                        No image set
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#141416]/90 via-[#141416]/30 to-transparent" />

                    {/* Top Status & Order */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-black/75 text-white backdrop-blur-md">
                        #{occ.sortOrder}
                      </span>
                      <button
                        onClick={() => handleToggleBannerStatus(occ)}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider shadow-sm cursor-pointer ${
                          occ.isActive ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
                        }`}
                      >
                        {occ.isActive ? "Active" : "Hidden"}
                      </button>
                    </div>

                    {/* Bottom Card Content Preview */}
                    <div className="relative z-10 space-y-1 text-white">
                      {occ.badge && (
                        <span className="inline-block px-2 py-0.2 rounded text-[9px] font-extrabold uppercase bg-white text-[#141416] shadow-xs">
                          {occ.badge}
                        </span>
                      )}
                      <h3 className="font-display text-base font-bold leading-tight">
                        {occ.title}
                      </h3>
                      {occ.subtitle && (
                        <p className="text-[11px] text-white/80 truncate">{occ.subtitle}</p>
                      )}
                      <p className="text-[10px] text-[#C59B27] font-mono truncate pt-1">
                        🔗 {occ.linkUrl}
                      </p>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="p-3 border-t border-slate-100 flex items-center justify-between gap-2 bg-slate-50">
                    <button
                      onClick={() => openEditBannerModal(occ)}
                      className="flex-1 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 border border-slate-200 text-slate-900 transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-1"
                    >
                      <span>✏️</span> Edit Card &amp; Image
                    </button>
                    <button
                      onClick={() => handleDeleteBanner(occ.id, occ.title)}
                      className="p-1.5 rounded-xl text-xs text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors cursor-pointer"
                      title="Delete Occasion"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === "HERO" ? (
          /* ========================================================
             TAB 2: HERO BANNER & SPOTLIGHT MANAGER
             ======================================================== */
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
              <span className="text-lg">🌟</span>
              <div>
                <p className="font-bold">Haute Couture Hero Section</p>
                <p className="text-amber-800/80 mt-0.5">
                  Customize the main headline, luxury tagline, and right-hand editorial lookbook model image that greets every visitor on your homepage.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {heroes.map((hero) => (
                <div
                  key={hero.id}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-700">
                        HERO #{hero.sortOrder}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{hero.title}</span>
                    </div>
                    <button
                      onClick={() => handleToggleBannerStatus(hero)}
                      className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider cursor-pointer ${
                        hero.isActive ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
                      }`}
                    >
                      {hero.isActive ? "Active on Homepage" : "Draft / Hidden"}
                    </button>
                  </div>

                  {/* Hero Preview Box */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 bg-[#FAF8F5] p-4 rounded-2xl border border-[#E7DFD5]">
                    <div className="sm:col-span-7 space-y-2">
                      {hero.badge && (
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-white border border-[#C59B27]/40 text-[#8E6C0C]">
                          {hero.badge}
                        </span>
                      )}
                      <h4 className="font-display text-lg font-bold text-slate-900 leading-snug">
                        {hero.title}
                      </h4>
                      <p className="text-xs text-slate-600 line-clamp-3">
                        {hero.subtitle}
                      </p>
                      <div className="pt-2">
                        <span className="inline-block px-4 py-1.5 rounded-full text-xs font-extrabold bg-[#C59B27] text-white">
                          {hero.buttonText || "Explore New Season →"}
                        </span>
                      </div>
                    </div>

                    <div className="sm:col-span-5 relative aspect-[3/4] rounded-xl overflow-hidden border border-[#E7DFD5] bg-slate-200">
                      {hero.imageUrl ? (
                        <Image
                          src={hero.imageUrl}
                          alt={hero.title}
                          fill
                          sizes="200px"
                          unoptimized
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-slate-400">
                          No model image
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-3 pt-2">
                    <button
                      onClick={() => openEditBannerModal(hero)}
                      className="flex-1 py-2 rounded-xl text-xs font-bold bg-[#141416] hover:bg-neutral-800 text-white transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>✏️</span> Edit Hero Headline, Text &amp; Model Image
                    </button>
                    <button
                      onClick={() => handleDeleteBanner(hero.id, hero.title)}
                      className="px-3 py-2 rounded-xl text-xs text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors cursor-pointer"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* ========================================================
             TAB 3: TOP BANNERS & POPUPS
             ======================================================== */
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {promotions.map((promo) => {
                const themeMeta = THEME_LABELS[promo.theme] || THEME_LABELS.FESTIVE_GOLD;
                const placeMeta = PLACEMENT_LABELS[promo.placement] || { label: promo.placement, icon: "📢" };

                return (
                  <div
                    key={promo.id}
                    className={`rounded-3xl border overflow-hidden flex flex-col justify-between bg-white shadow-sm hover:shadow-md transition-all ${
                      promo.isActive ? "border-slate-200" : "border-rose-200 opacity-60"
                    }`}
                  >
                    <div className={`p-5 space-y-3 ${themeMeta.bg} text-white`}>
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/15 backdrop-blur-md">
                          <span>{placeMeta.icon}</span>
                          <span>{placeMeta.label}</span>
                        </span>
                        <button
                          onClick={() => handleTogglePromoStatus(promo)}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase cursor-pointer ${
                            promo.isActive ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
                          }`}
                        >
                          {promo.isActive ? "Active" : "Hidden"}
                        </button>
                      </div>

                      <div>
                        {promo.badgeText && (
                          <span className={`text-[10px] font-extrabold uppercase ${themeMeta.text}`}>
                            {promo.badgeText}
                          </span>
                        )}
                        <h3 className="font-display text-base font-bold leading-snug">
                          {promo.title}
                        </h3>
                        {promo.subtitle && (
                          <p className="text-xs text-white/80 mt-1">{promo.subtitle}</p>
                        )}
                        {promo.discountCode && (
                          <div className="mt-2 inline-block px-2 py-0.5 rounded bg-white/20 font-mono text-[10px] font-bold">
                            CODE: {promo.discountCode}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-3 border-t border-slate-100 flex items-center justify-between gap-2 bg-slate-50">
                      <button
                        onClick={() => openEditPromoModal(promo)}
                        className="flex-1 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 border border-slate-200 text-slate-900 transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-1"
                      >
                        <span>✏️</span> Edit Promotion
                      </button>
                      <button
                        onClick={() => handleDeletePromo(promo.id, promo.title)}
                        className="p-1.5 rounded-xl text-xs text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors cursor-pointer"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================
          BANNER / OCCASION / HERO EDIT MODAL
          ======================================================== */}
      {isBannerModalOpen && (
        <div className="fixed inset-0 z-50 p-4 flex items-center justify-center animate-in fade-in duration-150">
          <div
            onClick={() => setIsBannerModalOpen(false)}
            className="fixed inset-0 bg-black/75 backdrop-blur-xs"
          />

          <div className="relative w-full max-w-xl rounded-3xl bg-white p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-6 z-10 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">
                  {bannerForm.position === "HERO" ? "🌟" : "👗"}
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  {editingBanner
                    ? `Edit ${bannerForm.position === "HERO" ? "Hero Banner" : "Occasion Card"}`
                    : `New ${bannerForm.position === "HERO" ? "Hero Banner" : "Occasion Card"}`}
                </h3>
              </div>
              <button
                onClick={() => setIsBannerModalOpen(false)}
                className="h-8 w-8 rounded-full border border-slate-200 hover:bg-slate-100 text-slate-500 font-bold flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBanner} className="space-y-4">
              {/* 🛍️ 1-Click Product Picker */}
              <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 space-y-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🛍️</span>
                    <div>
                      <p className="text-xs font-bold text-amber-950">Choose from Store Product Listings</p>
                      <p className="text-[10.5px] text-amber-800/80">1-click auto-fill title, image, price & direct link</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowProductPicker(!showProductPicker)}
                    className="px-3.5 py-1.5 rounded-xl bg-[#C59B27] hover:bg-[#B0881E] text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1"
                  >
                    <span>{showProductPicker ? "▲ Hide Products" : "▼ Pick Product (" + storeProducts.length + ")"}</span>
                  </button>
                </div>

                {/* Collapsible Product Selector Grid */}
                {showProductPicker && (
                  <div className="pt-2 border-t border-amber-200/60 space-y-2 animate-in fade-in duration-200">
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder={`Search ${activeStore === "jewellery" ? "Jewellery" : "Garments"} catalog by name or category...`}
                      className="w-full px-3 py-1.5 rounded-lg border border-amber-300 bg-white text-xs placeholder:text-slate-400 focus:outline-hidden focus:border-[#C59B27]"
                    />

                    <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                      {storeProducts
                        .filter((p) => {
                          if (!productSearch) return true;
                          const q = productSearch.toLowerCase();
                          return (
                            p.name?.toLowerCase().includes(q) ||
                            p.category?.name?.toLowerCase().includes(q)
                          );
                        })
                        .slice(0, 30)
                        .map((prod) => {
                          const img = prod.images?.[0]?.imageUrl || "";
                          const price = prod.variants?.[0]?.price
                            ? `₹${Number(prod.variants[0].price).toLocaleString("en-IN")}`
                            : "";

                          return (
                            <button
                              key={prod.id}
                              type="button"
                              onClick={() => handleSelectProductForBanner(prod)}
                              className="w-full p-2 rounded-xl bg-white hover:bg-amber-100/60 border border-amber-200/60 transition-all flex items-center gap-3 text-left group cursor-pointer shadow-2xs"
                            >
                              <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                                {img ? (
                                  <Image
                                    src={img}
                                    alt={prod.name}
                                    fill
                                    sizes="40px"
                                    unoptimized
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center text-[9px] text-slate-400">
                                    No img
                                  </div>
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  {prod.category?.name && (
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#C59B27]">
                                      {prod.category.name}
                                    </span>
                                  )}
                                  {price && (
                                    <span className="text-[10px] font-mono font-bold text-slate-700">
                                      · {price}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs font-semibold text-slate-900 truncate group-hover:text-[#C59B27]">
                                  {prod.name}
                                </p>
                              </div>

                              <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-100 group-hover:bg-[#C59B27] group-hover:text-white text-amber-900 shrink-0 transition-colors">
                                Select →
                              </span>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>

              {/* Type / Position Indicator */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Section Type
                </label>
                <select
                  value={bannerForm.position}
                  onChange={(e) => setBannerForm({ ...bannerForm, position: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:border-[#C59B27]"
                >
                  <option value="OCCASION">👗 Shop by Occasion Card</option>
                  <option value="HERO">🌟 Hero Main Lookbook Banner</option>
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  {bannerForm.position === "HERO" ? "Main Headline *" : "Occasion Title *"}
                </label>
                <input
                  type="text"
                  required
                  value={bannerForm.title}
                  onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                  placeholder="e.g., Festive & Gala Edit, Wedding Silk Soirée"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:border-[#C59B27]"
                />
              </div>

              {/* Subtitle */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  {bannerForm.position === "HERO" ? "Sub-Headline / Story Tagline" : "Subtitle / Garment Details"}
                </label>
                <input
                  type="text"
                  value={bannerForm.subtitle}
                  onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                  placeholder="e.g., Zari Velvet & Anarkalis, French Linen & Mandarin Shirts"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:border-[#C59B27]"
                />
              </div>

              {/* Tag Badge */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Tag Badge
                </label>
                <input
                  type="text"
                  value={bannerForm.badge}
                  onChange={(e) => setBannerForm({ ...bannerForm, badge: e.target.value })}
                  placeholder="e.g., Artisanal Craft, Pure Silk, Flat 40% Off"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:border-[#C59B27]"
                />
              </div>

              {/* Image URL & Upload */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Card / Model Photo
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={bannerForm.imageUrl}
                    onChange={(e) => setBannerForm({ ...bannerForm, imageUrl: e.target.value.trim() })}
                    placeholder="Paste image link (https://...) or upload below"
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:outline-hidden focus:border-[#C59B27]"
                  />
                  <label className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer shrink-0 flex items-center gap-1">
                    <span>📷</span>
                    <span>{uploadingImage ? "Uploading…" : "Upload"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBannerFileUpload}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                  </label>
                </div>

                {/* Quick Presets / Suggestions */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-500 font-bold">Presets:</span>
                  <button
                    type="button"
                    onClick={() => setBannerForm({ ...bannerForm, imageUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80" })}
                    className="px-2 py-0.5 rounded text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                  >
                    Varanasi Silk
                  </button>
                  <button
                    type="button"
                    onClick={() => setBannerForm({ ...bannerForm, imageUrl: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&auto=format&fit=crop&q=80" })}
                    className="px-2 py-0.5 rounded text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                  >
                    Bridal Soirée
                  </button>
                  <button
                    type="button"
                    onClick={() => setBannerForm({ ...bannerForm, imageUrl: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80" })}
                    className="px-2 py-0.5 rounded text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                  >
                    French Linen
                  </button>
                  <button
                    type="button"
                    onClick={() => setBannerForm({ ...bannerForm, imageUrl: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&auto=format&fit=crop&q=80" })}
                    className="px-2 py-0.5 rounded text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                  >
                    Chanderi Co-ord
                  </button>
                </div>

                {/* Image Live Preview */}
                {bannerForm.imageUrl && (
                  <div className="relative h-44 w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 mt-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={bannerForm.imageUrl}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Target Link & Button Text */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Destination Link URL
                  </label>
                  <input
                    type="text"
                    value={bannerForm.linkUrl}
                    onChange={(e) => setBannerForm({ ...bannerForm, linkUrl: e.target.value })}
                    placeholder="/shop?category=women-kurtis"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:outline-hidden focus:border-[#C59B27]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Button Text
                  </label>
                  <input
                    type="text"
                    value={bannerForm.buttonText}
                    onChange={(e) => setBannerForm({ ...bannerForm, buttonText: e.target.value })}
                    placeholder="Explore Outfits"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:border-[#C59B27]"
                  />
                </div>
              </div>

              {/* Sort Order & Active */}
              <div className="grid grid-cols-2 gap-3 items-center pt-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={bannerForm.sortOrder}
                    onChange={(e) => setBannerForm({ ...bannerForm, sortOrder: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:border-[#C59B27]"
                  />
                </div>

                <div className="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    id="bannerActive"
                    checked={bannerForm.isActive}
                    onChange={(e) => setBannerForm({ ...bannerForm, isActive: e.target.checked })}
                    className="w-4 h-4 rounded accent-[#C59B27] cursor-pointer"
                  />
                  <label htmlFor="bannerActive" className="text-xs font-bold text-slate-800 cursor-pointer">
                    Show on Homepage
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsBannerModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-[#C59B27] hover:bg-[#B0881E] text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Saving…" : editingBanner ? "Update Card" : "Create Card"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          PROMOTION EDIT MODAL
          ======================================================== */}
      {isPromoModalOpen && (
        <div className="fixed inset-0 z-50 p-4 flex items-center justify-center animate-in fade-in duration-150">
          <div
            onClick={() => setIsPromoModalOpen(false)}
            className="fixed inset-0 bg-black/75 backdrop-blur-xs"
          />

          <div className="relative w-full max-w-xl rounded-3xl bg-white p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-6 z-10 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">📢</span>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  {editingPromo ? "Edit Promotion Offer" : "New Promotional Campaign"}
                </h3>
              </div>
              <button
                onClick={() => setIsPromoModalOpen(false)}
                className="h-8 w-8 rounded-full border border-slate-200 hover:bg-slate-100 text-slate-500 font-bold flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePromo} className="space-y-4">
              {/* 🛍️ 1-Click Product Picker for Promos */}
              <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 space-y-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🛍️</span>
                    <div>
                      <p className="text-xs font-bold text-amber-950">Choose from Store Product Listings</p>
                      <p className="text-[10.5px] text-amber-800/80">Auto-fill offer title, photo & direct link</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPromoProductPicker(!showPromoProductPicker)}
                    className="px-3.5 py-1.5 rounded-xl bg-[#C59B27] hover:bg-[#B0881E] text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1"
                  >
                    <span>{showPromoProductPicker ? "▲ Hide Products" : "▼ Pick Product (" + storeProducts.length + ")"}</span>
                  </button>
                </div>

                {/* Collapsible Product Selector Grid */}
                {showPromoProductPicker && (
                  <div className="pt-2 border-t border-amber-200/60 space-y-2 animate-in fade-in duration-200">
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder={`Search ${activeStore === "jewellery" ? "Jewellery" : "Garments"} catalog by name or category...`}
                      className="w-full px-3 py-1.5 rounded-lg border border-amber-300 bg-white text-xs placeholder:text-slate-400 focus:outline-hidden focus:border-[#C59B27]"
                    />

                    <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                      {storeProducts
                        .filter((p) => {
                          if (!productSearch) return true;
                          const q = productSearch.toLowerCase();
                          return (
                            p.name?.toLowerCase().includes(q) ||
                            p.category?.name?.toLowerCase().includes(q)
                          );
                        })
                        .slice(0, 30)
                        .map((prod) => {
                          const img = prod.images?.[0]?.imageUrl || "";
                          const price = prod.variants?.[0]?.price
                            ? `₹${Number(prod.variants[0].price).toLocaleString("en-IN")}`
                            : "";

                          return (
                            <button
                              key={prod.id}
                              type="button"
                              onClick={() => handleSelectProductForPromo(prod)}
                              className="w-full p-2 rounded-xl bg-white hover:bg-amber-100/60 border border-amber-200/60 transition-all flex items-center gap-3 text-left group cursor-pointer shadow-2xs"
                            >
                              <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                                {img ? (
                                  <Image
                                    src={img}
                                    alt={prod.name}
                                    fill
                                    sizes="40px"
                                    unoptimized
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center text-[9px] text-slate-400">
                                    No img
                                  </div>
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  {prod.category?.name && (
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#C59B27]">
                                      {prod.category.name}
                                    </span>
                                  )}
                                  {price && (
                                    <span className="text-[10px] font-mono font-bold text-slate-700">
                                      · {price}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs font-semibold text-slate-900 truncate group-hover:text-[#C59B27]">
                                  {prod.name}
                                </p>
                              </div>

                              <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-100 group-hover:bg-[#C59B27] group-hover:text-white text-amber-900 shrink-0 transition-colors">
                                Select →
                              </span>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Placement Location *
                  </label>
                  <select
                    value={promoForm.placement}
                    onChange={(e) => setPromoForm({ ...promoForm, placement: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:border-[#C59B27]"
                  >
                    <option value="TOP_BANNER">📢 Top Announcement Bar</option>
                    <option value="POPUP_MODAL">🖼️ Popup Poster Modal</option>
                    <option value="HERO_SPOTLIGHT">🌟 Homepage Hero Spotlight</option>
                    <option value="FLOAT_SNACKBAR">🏷️ Floating Bottom Offer Badge</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Luxury Color Theme
                  </label>
                  <select
                    value={promoForm.theme}
                    onChange={(e) => setPromoForm({ ...promoForm, theme: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:border-[#C59B27]"
                  >
                    <option value="FESTIVE_GOLD">👑 Champagne Gold (Festive)</option>
                    <option value="ROYAL_RUBY">🌹 Royal Ruby (Bridal / Wedding)</option>
                    <option value="EMERALD_EID">🌿 Emerald Eid (Festive Green)</option>
                    <option value="SUNSET_ORANGE">🌅 Sunset Orange (Summer / Holi)</option>
                    <option value="MODERN_DARK">🖤 Modern Obsidian Noir</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Offer Title *
                </label>
                <input
                  type="text"
                  required
                  value={promoForm.title}
                  onChange={(e) => setPromoForm({ ...promoForm, title: e.target.value })}
                  placeholder="e.g., Flat 10% Off on First Order + Free Express Shipping"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:border-[#C59B27]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Subtitle Description
                </label>
                <input
                  type="text"
                  value={promoForm.subtitle}
                  onChange={(e) => setPromoForm({ ...promoForm, subtitle: e.target.value })}
                  placeholder="e.g., Applicable on all handcrafted sarees, kurtis & linen shirts."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:border-[#C59B27]"
                />
              </div>

              {/* Promotional Poster / Image URL & Upload (Upload or URL) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Poster / Model Photo (Upload or URL)
                  </label>
                  {promoForm.imageUrl && (
                    <button
                      type="button"
                      onClick={() => setPromoForm({ ...promoForm, imageUrl: "" })}
                      className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                    >
                      Remove Image ✕
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoForm.imageUrl}
                    onChange={(e) => setPromoForm({ ...promoForm, imageUrl: e.target.value.trim() })}
                    placeholder="Paste image link (https://...) or upload from device"
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:outline-hidden focus:border-[#C59B27]"
                  />
                  <label className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer shrink-0 flex items-center gap-1.5 transition-colors">
                    <span>📷</span>
                    <span>{uploadingImage ? "Uploading…" : "Upload File"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePromoFileUpload}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                  </label>
                </div>

                {/* Quick Presets / Suggestions */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-500 font-bold">Presets:</span>
                  <button
                    type="button"
                    onClick={() => setPromoForm({ ...promoForm, imageUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80" })}
                    className="px-2 py-0.5 rounded text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                  >
                    Varanasi Silk
                  </button>
                  <button
                    type="button"
                    onClick={() => setPromoForm({ ...promoForm, imageUrl: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=80" })}
                    className="px-2 py-0.5 rounded text-[9px] bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold cursor-pointer"
                  >
                    Kundan Jewellery
                  </button>
                  <button
                    type="button"
                    onClick={() => setPromoForm({ ...promoForm, imageUrl: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&auto=format&fit=crop&q=80" })}
                    className="px-2 py-0.5 rounded text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                  >
                    Bridal Soirée
                  </button>
                  <button
                    type="button"
                    onClick={() => setPromoForm({ ...promoForm, imageUrl: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80" })}
                    className="px-2 py-0.5 rounded text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                  >
                    French Linen
                  </button>
                </div>

                {/* Image Live Preview */}
                {promoForm.imageUrl && (
                  <div className="relative h-44 w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 mt-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={promoForm.imageUrl}
                      alt="Promotion Poster Preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Badge Text
                  </label>
                  <input
                    type="text"
                    value={promoForm.badgeText}
                    onChange={(e) => setPromoForm({ ...promoForm, badgeText: e.target.value })}
                    placeholder="e.g., FESTIVE OFFER"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:border-[#C59B27]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Coupon Code
                  </label>
                  <input
                    type="text"
                    value={promoForm.discountCode}
                    onChange={(e) => setPromoForm({ ...promoForm, discountCode: e.target.value.toUpperCase() })}
                    placeholder="e.g., FESTIVE10"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold focus:outline-hidden focus:border-[#C59B27]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    CTA Button Text
                  </label>
                  <input
                    type="text"
                    value={promoForm.ctaText}
                    onChange={(e) => setPromoForm({ ...promoForm, ctaText: e.target.value })}
                    placeholder="Shop Now"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:border-[#C59B27]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    CTA Link URL
                  </label>
                  <input
                    type="text"
                    value={promoForm.ctaUrl}
                    onChange={(e) => setPromoForm({ ...promoForm, ctaUrl: e.target.value })}
                    placeholder="/shop"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:outline-hidden focus:border-[#C59B27]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsPromoModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-[#C59B27] hover:bg-[#B0881E] text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Saving…" : editingPromo ? "Update Offer" : "Launch Offer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
