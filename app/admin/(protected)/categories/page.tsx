"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/providers/ToastProvider";

type SubCategory = {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
  parentId: string | null;
  isActive: boolean;
  sortOrder: number;
  _count?: { products: number };
};

type Category = {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
  parentId: string | null;
  isActive: boolean;
  sortOrder: number;
  _count?: { products: number };
  children?: SubCategory[];
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function AdminCategoriesPage() {
  const { success, error: toastError } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "HIDDEN">("ALL");

  // Modal / Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"NEW_PARENT" | "NEW_SUB" | "EDIT">("NEW_PARENT");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugAuto, setSlugAuto] = useState(true);
  const [imageUrl, setImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [parentId, setParentId] = useState<string>("");
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Quick inline add state per category ID: { [categoryId]: string }
  const [quickSubName, setQuickSubName] = useState<Record<string, string>>({});
  const [quickSubSaving, setQuickSubSaving] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/categories?includeInactive=true");
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (e) {
      console.error(e);
      toastError("Error", "Could not load categories.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function handleNameChange(val: string) {
    setName(val);
    if (slugAuto) {
      setSlug(slugify(val));
    }
  }

  // Upload handler for category image
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toastError("File Too Large", "Image must be under 5MB.");
      return;
    }

    setUploadingImage(true);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl) setImageUrl(dataUrl);
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
        setImageUrl(data.url);
        success("Image Uploaded", "Hero lookbook photo ready!");
      }
    } catch {
      // FileReader dataUrl retained
    } finally {
      setUploadingImage(false);
    }
  }

  function openNewParentModal() {
    setModalMode("NEW_PARENT");
    setEditingId(null);
    setName("");
    setSlug("");
    setSlugAuto(true);
    setImageUrl("");
    setParentId("");
    setSortOrder(0);
    setIsActive(true);
    setFormError(null);
    setIsModalOpen(true);
  }

  function openNewSubModal(parentCatId: string) {
    setModalMode("NEW_SUB");
    setEditingId(null);
    setName("");
    setSlug("");
    setSlugAuto(true);
    setImageUrl("");
    setParentId(parentCatId);
    setSortOrder(0);
    setIsActive(true);
    setFormError(null);
    setIsModalOpen(true);
  }

  function openEditModal(cat: Category | SubCategory) {
    setModalMode("EDIT");
    setEditingId(cat.id);
    setName(cat.name);
    setSlug(cat.slug);
    setSlugAuto(false);
    setImageUrl(cat.imageUrl || "");
    setParentId(cat.parentId || "");
    setSortOrder(cat.sortOrder || 0);
    setIsActive(cat.isActive);
    setFormError(null);
    setIsModalOpen(true);
  }

  async function handleModalSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("Please enter a category name");
      return;
    }

    setSaving(true);
    setFormError(null);

    const cleanSlug = slug.trim() || slugify(name);
    const payload = {
      name: name.trim(),
      slug: cleanSlug,
      imageUrl: imageUrl.trim() || null,
      parentId: parentId || null,
      sortOrder: Number(sortOrder) || 0,
      isActive,
    };

    try {
      const url = editingId ? `/api/categories/${editingId}` : "/api/categories";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setSaving(false);

      if (!res.ok) {
        setFormError(data.error || "Failed to save category");
        return;
      }

      success(
        editingId ? "Category Updated" : "Category Created 🎉",
        `"${name}" was saved successfully.`
      );
      setIsModalOpen(false);
      load();
    } catch {
      setSaving(false);
      setFormError("Network error while saving category");
    }
  }

  async function handleQuickAddSub(parentCatId: string, parentCatName: string) {
    const subName = quickSubName[parentCatId]?.trim();
    if (!subName) return;

    setQuickSubSaving(parentCatId);
    const generatedSlug = slugify(subName);

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: subName,
          slug: generatedSlug,
          parentId: parentCatId,
          isActive: true,
          sortOrder: 0,
        }),
      });

      const data = await res.json();
      setQuickSubSaving(null);

      if (!res.ok) {
        toastError("Add Subcategory Failed", data.error || "Could not add subcategory");
        return;
      }

      success("Subcategory Added 🎉", `Added "${subName}" to ${parentCatName}.`);
      setQuickSubName((prev) => ({ ...prev, [parentCatId]: "" }));
      load();
    } catch {
      setQuickSubSaving(null);
      toastError("Error", "Network error while creating subcategory");
    }
  }

  async function toggleActive(cat: Category | SubCategory) {
    try {
      const nextStatus = !cat.isActive;
      const res = await fetch(`/api/categories/${cat.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      
      if (nextStatus) {
        success("Category Activated 🎉", `"${cat.name}" is now visible on the storefront.`);
      } else {
        success("Category Hidden", `"${cat.name}" is now hidden from the storefront (can be unhidden anytime).`);
      }
      load();
    } catch {
      toastError("Error", "Could not update status.");
    }
  }

  async function handleDelete(cat: Category | SubCategory, isSub: boolean) {
    const message = isSub
      ? `Are you sure you want to delete subcategory "${cat.name}"?`
      : `Are you sure you want to delete department "${cat.name}" and its subcategories?`;

    if (!confirm(message)) return;

    try {
      const res = await fetch(`/api/categories/${cat.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toastError("Delete Failed", data.error || "Could not remove category.");
        return;
      }
      success("Category Removed 🎉", `"${cat.name}" was removed successfully.`);
      load();
    } catch {
      toastError("Delete Failed", "Network error while removing category.");
    }
  }

  const activeCount = categories.filter((c) => c.isActive).length;
  const hiddenCount = categories.filter((c) => !c.isActive).length;

  const filteredCategories = categories.filter((cat) => {
    // Status filter
    if (statusFilter === "ACTIVE" && !cat.isActive) return false;
    if (statusFilter === "HIDDEN" && cat.isActive) return false;

    // Search query
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchesParent = cat.name.toLowerCase().includes(q) || cat.slug.toLowerCase().includes(q);
    const matchesChild = (cat.children || []).some(
      (child) => child.name.toLowerCase().includes(q) || child.slug.toLowerCase().includes(q)
    );
    return matchesParent || matchesChild;
  });

  const totalSubcategories = categories.reduce((acc, c) => acc + (c.children?.length || 0), 0);

  return (
    <div className="h-full overflow-y-auto min-h-0 space-y-6 pr-1 pb-10">
      {/* Top Header & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold flex items-center gap-2 text-slate-900">
            <span>🏷️</span> Categories &amp; Subcategories Manager
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Full control to create, modify, unhide, sort, and manage all {categories.length} departments and {totalSubcategories} subcategories
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={openNewParentModal}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#141416] text-white hover:bg-[#25262B] shadow-md transition-all cursor-pointer"
          >
            <span>+</span> Add Department Category
          </button>
        </div>
      </div>

      {/* Filter Tabs & KPI Stats & Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Status Filter Tabs */}
        <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Department Status</p>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`flex-1 py-1 px-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                statusFilter === "ALL" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              All ({categories.length})
            </button>
            <button
              onClick={() => setStatusFilter("ACTIVE")}
              className={`flex-1 py-1 px-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                statusFilter === "ACTIVE" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-500 hover:text-emerald-700"
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => setStatusFilter("HIDDEN")}
              className={`flex-1 py-1 px-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                statusFilter === "HIDDEN" ? "bg-amber-600 text-white shadow-xs" : "text-slate-500 hover:text-amber-700"
              }`}
            >
              Hidden ({hiddenCount})
            </button>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Subcategories</p>
            <p className="text-xl font-bold font-display text-[#C59B27] mt-0.5">{totalSubcategories}</p>
          </div>
          <span className="text-2xl">✨</span>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Quick Search</p>
          <input
            type="text"
            placeholder="Search categories or subcategories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-hidden focus:border-[#141416]"
          />
        </div>
      </div>

      {/* Category List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredCategories.map((cat) => {
          const subCount = (cat.children ?? []).length;

          return (
            <div
              key={cat.id}
              className={`rounded-2xl border bg-white p-5 space-y-4 shadow-sm hover:shadow-md transition-all ${
                cat.isActive ? "border-slate-200" : "border-amber-300 bg-amber-50/20"
              }`}
            >
              {/* Category Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-slate-900 font-display">
                      {cat.name}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 font-mono">
                      {cat._count?.products || 0} products
                    </span>
                  </div>
                  <p className="text-xs font-mono text-[#C59B27] mt-0.5">/{cat.slug}</p>
                </div>

                {/* Parent Category Actions & Unhide Toggle */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => toggleActive(cat)}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                      cat.isActive
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                        : "bg-amber-100 text-amber-800 border-amber-400 hover:bg-amber-200 shadow-xs"
                    }`}
                    title={cat.isActive ? "Click to Hide from Storefront" : "Click to Unhide / Activate on Storefront"}
                  >
                    <span>{cat.isActive ? "● Active" : "👁️ Unhide / Activate"}</span>
                  </button>

                  <button
                    onClick={() => openEditModal(cat)}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs text-slate-700 transition-colors cursor-pointer"
                    title="Edit category"
                  >
                    ✏️
                  </button>

                  <button
                    onClick={() => handleDelete(cat, false)}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-xs text-rose-600 transition-colors cursor-pointer"
                    title="Delete category"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Subcategories Container */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] uppercase font-extrabold tracking-wider text-slate-500">
                    SUBCATEGORIES ({subCount}):
                  </p>
                  <button
                    onClick={() => openNewSubModal(cat.id)}
                    className="text-[11px] font-bold text-[#141416] hover:text-[#C59B27] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>+</span> Add Subcategory
                  </button>
                </div>

                {/* Subcategory Pills */}
                {subCount > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {cat.children!.map((sub) => (
                      <span
                        key={sub.id}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border shadow-2xs transition-all ${
                          sub.isActive
                            ? "bg-white text-slate-800 border-slate-200"
                            : "bg-amber-50 text-amber-900 border-amber-300"
                        }`}
                      >
                        <span>{sub.name}</span>
                        <span className="text-[10px] font-mono text-slate-400">({sub._count?.products || 0})</span>

                        <button
                          onClick={() => toggleActive(sub)}
                          className="ml-1 text-[10px] px-1.5 py-0.5 rounded font-bold border transition-all cursor-pointer"
                          style={{
                            backgroundColor: sub.isActive ? "#f0fdf4" : "#fef3c7",
                            color: sub.isActive ? "#15803d" : "#92400e",
                            borderColor: sub.isActive ? "#bbf7d0" : "#fde68a",
                          }}
                          title={sub.isActive ? "Click to Hide Subcategory" : "Click to Unhide Subcategory"}
                        >
                          {sub.isActive ? "Active" : "Unhide"}
                        </button>

                        <button
                          onClick={() => openEditModal(sub)}
                          className="text-[11px] text-[#C59B27] hover:scale-115 transition-transform cursor-pointer"
                          title="Edit subcategory name/slug"
                        >
                          ✏️
                        </button>

                        <button
                          onClick={() => handleDelete(sub, true)}
                          className="text-[11px] text-rose-500 hover:scale-115 transition-transform cursor-pointer"
                          title="Delete subcategory"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded-lg border border-dashed border-slate-300 text-center text-slate-400 text-xs">
                    No subcategories added yet. Use the quick add bar below!
                  </div>
                )}

                {/* 1-Click Quick Add Subcategory Input Bar */}
                <div className="pt-2 border-t border-slate-200/80 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={`Add subcategory to ${cat.name}...`}
                    value={quickSubName[cat.id] || ""}
                    onChange={(e) =>
                      setQuickSubName((prev) => ({ ...prev, [cat.id]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleQuickAddSub(cat.id, cat.name);
                      }
                    }}
                    className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:border-[#141416]"
                  />
                  <button
                    onClick={() => handleQuickAddSub(cat.id, cat.name)}
                    disabled={!quickSubName[cat.id]?.trim() || quickSubSaving === cat.id}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#141416] text-white hover:bg-[#25262B] disabled:opacity-50 transition-all cursor-pointer shrink-0"
                  >
                    {quickSubSaving === cat.id ? "Adding..." : "+ Quick Add"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredCategories.length === 0 && !loading && (
          <div className="col-span-2 p-12 text-center text-slate-400 rounded-2xl border border-slate-200 bg-white">
            <p className="text-4xl">🏷️</p>
            <p className="font-bold text-sm text-slate-800 mt-2">No matching categories found.</p>
            <button
              onClick={openNewParentModal}
              className="mt-3 inline-block px-4 py-2 rounded-xl text-xs font-bold uppercase bg-[#141416] text-white cursor-pointer"
            >
              + Create Category Now
            </button>
          </div>
        )}
      </div>

      {/* Interactive Modal for Add / Edit Category & Subcategory */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="font-display text-xl font-bold text-slate-900">
                  {modalMode === "EDIT"
                    ? "Edit Category / Subcategory"
                    : modalMode === "NEW_SUB"
                    ? "Add New Subcategory"
                    : "Add Main Department Category"}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {modalMode === "EDIT"
                    ? `Update details for "${name}"`
                    : modalMode === "NEW_SUB"
                    ? `Adding subcategory under ${categories.find((c) => c.id === parentId)?.name || "selected parent"}`
                    : "Create a top-level department in the catalog"}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="h-8 w-8 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                ⚠️ {formError}
              </div>
            )}

            <form onSubmit={handleModalSubmit} className="space-y-4">
              {/* Category Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Category / Subcategory Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Mulberry Silk Sarees, Cotton Kurtis, Linen Shirts..."
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:border-[#141416]"
                />
              </div>

              {/* Slug */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    URL Slug *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setSlug(slugify(name));
                      setSlugAuto(true);
                    }}
                    className="text-[10px] text-[#C59B27] hover:underline font-semibold cursor-pointer"
                  >
                    Auto-generate from Name
                  </button>
                </div>
                <div className="flex items-center rounded-xl border border-slate-300 overflow-hidden bg-slate-50">
                  <span className="px-3 text-xs text-slate-400 font-mono">/</span>
                  <input
                    type="text"
                    required
                    placeholder="mulberry-silk-sarees"
                    value={slug}
                    onChange={(e) => {
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"));
                      setSlugAuto(false);
                    }}
                    className="w-full text-xs font-mono py-2.5 pr-3.5 bg-transparent focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Parent Category Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Department / Parent Category
                </label>
                <select
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:border-[#141416]"
                >
                  <option value="">(None - Top Level Department Category)</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id} disabled={c.id === editingId}>
                      📁 {c.name}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Select a parent to make this a subcategory, or choose &quot;None&quot; for a root department.
                </p>
              </div>

              {/* Category / Subcategory Lookbook Photo */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Card / Silhouette Hero Image
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value.trim())}
                    placeholder="https://images.unsplash.com/... or upload below"
                    className="flex-1 text-xs font-mono px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:border-[#141416]"
                  />
                  <label className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer shrink-0 flex items-center gap-1.5">
                    <span>📷</span>
                    <span>{uploadingImage ? "Uploading…" : "Upload"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                  </label>
                </div>

                {/* Presets */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-500 font-bold">Presets:</span>
                  <button
                    type="button"
                    onClick={() => setImageUrl("https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80")}
                    className="px-2 py-0.5 rounded text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                  >
                    Mulberry Silk
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageUrl("https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80")}
                    className="px-2 py-0.5 rounded text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                  >
                    Linen Shirt
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageUrl("https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80")}
                    className="px-2 py-0.5 rounded text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                  >
                    Cocktail Gown
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageUrl("https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=800&auto=format&fit=crop&q=80")}
                    className="px-2 py-0.5 rounded text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                  >
                    Junior Cotton
                  </button>
                </div>

                {/* Live Preview */}
                {imageUrl && (
                  <div className="relative h-36 w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 mt-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt="Category Preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Active Toggle & Sort Order */}
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Catalog Visibility
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsActive(!isActive)}
                    className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      isActive
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                        : "bg-amber-50 text-amber-800 border-amber-300"
                    }`}
                  >
                    {isActive ? "✓ Active (Visible on Storefront)" : "○ Hidden (Click to Unhide)"}
                  </button>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#141416] text-white hover:bg-[#25262B] disabled:opacity-50 transition-all shadow-md cursor-pointer"
                >
                  {saving ? "Saving..." : editingId ? "Save Changes" : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
