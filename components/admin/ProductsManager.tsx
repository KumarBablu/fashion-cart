"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { formatINR } from "@/lib/format";
import { useToast } from "@/components/providers/ToastProvider";
import DownloadCsvButton from "./DownloadCsvButton";
import BulkProductUploadModal from "./BulkProductUploadModal";
import { normalizeImageUrl } from "@/lib/utils/imageUrl";

type ProductItem = {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  fabric: string | null;
  status: string;
  category: {
    id: string;
    name: string;
    slug: string;
    parentId: string | null;
    parent?: { id: string; name: string; slug: string } | null;
  } | null;
  variants: {
    id: string;
    sku: string;
    colour: string;
    size: string;
    price: number;
    compareAtPrice: number | null;
    stockQuantity: number;
    isActive: boolean;
  }[];
  images: { id: string; imageUrl: string; altText: string | null }[];
  createdAt: string;
};

type CategoryOption = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
};

export default function ProductsManager({
  initialProducts,
  categories,
}: {
  initialProducts: ProductItem[];
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [products, setProducts] = useState<ProductItem[]>(initialProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("ALL");
  const [selectedSubcategory, setSelectedSubcategory] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState<"ALL" | "ACTIVE" | "DRAFT" | "ARCHIVED">("ALL");
  const [selectedStockFilter, setSelectedStockFilter] = useState<"ALL" | "LOW" | "OUT" | "IN">("ALL");
  const [viewMode, setViewMode] = useState<"GRID" | "TABLE">("GRID");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [targetMoveCategoryId, setTargetMoveCategoryId] = useState("");

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteModalProduct, setDeleteModalProduct] = useState<ProductItem | null>(null);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [bulkUploadModalOpen, setBulkUploadModalOpen] = useState(false);

  // Departments and Subcategories
  const departments = categories.filter((c) => !c.parentId);
  const subcategories = categories.filter((c) =>
    selectedDepartment === "ALL" ? !!c.parentId : c.parentId === selectedDepartment
  );

  // Filter products
  const filtered = products.filter((p) => {
    // Search match
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchSlug = p.slug.toLowerCase().includes(q);
      const matchFabric = p.fabric?.toLowerCase().includes(q) || false;
      const matchSku = p.variants.some((v) => v.sku.toLowerCase().includes(q));
      if (!matchName && !matchSlug && !matchFabric && !matchSku) return false;
    }

    // Department match
    if (selectedDepartment !== "ALL") {
      const isDirectDept = p.category?.id === selectedDepartment;
      const isParentDept = p.category?.parentId === selectedDepartment;
      if (!isDirectDept && !isParentDept) return false;
    }

    // Subcategory match
    if (selectedSubcategory !== "ALL") {
      if (p.category?.id !== selectedSubcategory) return false;
    }

    // Status match
    if (selectedStatus !== "ALL" && p.status !== selectedStatus) return false;

    // Stock match
    const totalStock = p.variants.reduce((acc, v) => acc + v.stockQuantity, 0);
    if (selectedStockFilter === "IN" && totalStock <= 0) return false;
    if (selectedStockFilter === "LOW" && (totalStock > 5 || totalStock <= 0)) return false;
    if (selectedStockFilter === "OUT" && totalStock > 0) return false;

    return true;
  });

  // Pagination slicing
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedProducts = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Selection helpers
  const allFilteredSelected = paginatedProducts.length > 0 && paginatedProducts.every((p) => selectedIds.has(p.id));

  function toggleSelectAll() {
    if (allFilteredSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginatedProducts.forEach((p) => next.delete(p.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginatedProducts.forEach((p) => next.add(p.id));
        return next;
      });
    }
  }

  function toggleSelectOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  // Execute Bulk Action
  async function handleBulkAction(action: "ACTIVATE" | "DRAFT" | "ARCHIVE" | "DELETE" | "CHANGE_CATEGORY", customCategory?: string) {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    setBulkActionLoading(true);
    try {
      const res = await fetch("/api/admin/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productIds: ids,
          action,
          categoryId: customCategory || targetMoveCategoryId || undefined,
        }),
      });

      const data = await res.json().catch(() => ({ error: `Server error (${res.status})` }));
      setBulkActionLoading(false);

      if (!res.ok) {
        toastError("Bulk Action Failed", data.error || "Could not complete bulk action");
        return;
      }

      success("Bulk Action Complete 🎉", data.message || "Updated selected products.");
      setSelectedIds(new Set());
      setBulkDeleteModalOpen(false);
      router.refresh();

      // Optimistic local state update
      if (action === "ACTIVATE") {
        setProducts((prev) => prev.map((p) => (ids.includes(p.id) ? { ...p, status: "ACTIVE" } : p)));
      } else if (action === "DRAFT") {
        setProducts((prev) => prev.map((p) => (ids.includes(p.id) ? { ...p, status: "DRAFT" } : p)));
      } else if (action === "ARCHIVE") {
        setProducts((prev) => prev.map((p) => (ids.includes(p.id) ? { ...p, status: "ARCHIVED" } : p)));
      } else if (action === "DELETE") {
        setProducts((prev) => prev.filter((p) => !ids.includes(p.id)));
      }
    } catch {
      setBulkActionLoading(false);
      toastError("Error", "Network error during bulk action");
    }
  }

  async function duplicateProduct(prodId: string) {
    setActionLoading(`dup-${prodId}`);
    try {
      const res = await fetch(`/api/admin/products/${prodId}/duplicate`, { method: "POST" });
      const data = await res.json().catch(() => ({ error: `Server error (${res.status})` }));
      if (!res.ok) throw new Error(data.error || "Failed to duplicate");
      success("Product Duplicated 🎉", `Created copy "${data.product.name}"`);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error duplicating product";
      toastError("Action Failed", msg);
    } finally {
      setActionLoading(null);
    }
  }

  async function confirmDelete(hard: boolean) {
    if (!deleteModalProduct) return;
    const prodId = deleteModalProduct.id;
    setActionLoading(`del-${prodId}`);

    try {
      const res = await fetch(`/api/admin/products/${prodId}/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hard }),
      });
      const data = await res.json().catch(() => ({ error: `Server error (${res.status})` }));
      if (!res.ok) throw new Error(data.error || "Failed to delete");

      if (data.deleted) {
        setProducts((prev) => prev.filter((p) => p.id !== prodId));
        success("Product Removed 🗑️", "Product permanently deleted from database.");
      } else {
        setProducts((prev) =>
          prev.map((p) => (p.id === prodId ? { ...p, status: "ARCHIVED" } : p))
        );
        success("Product Archived 📦", "Product archived to preserve order history.");
      }
      setDeleteModalProduct(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error deleting product";
      toastError("Action Failed", msg);
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="h-full flex flex-col min-h-0 space-y-3">
      {/* 1. TOP HEADER & FILTER CONTROLS (Fixed at Top) */}
      <div className="shrink-0 space-y-2.5 bg-[#FAF8F5]">
        {/* Top Header & Action Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-xl sm:text-2xl font-bold flex items-center gap-2 text-slate-900 leading-tight">
              <span>👗</span> Catalog &amp; Products Manager
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Full management of luxury catalog, stock, and bulk actions ({products.length} garments total)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <DownloadCsvButton type="template" label="Template" icon="📋" />
            <DownloadCsvButton type="products" label="Export CSV" icon="📥" />
            <button
              type="button"
              onClick={() => {
                if (products.length === 0) {
                  toastError("Catalog Empty", "There are no products in the catalog.");
                  return;
                }
                const ids = products.map((p) => p.id);
                setSelectedIds(new Set(ids));
                setBulkDeleteModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors shadow-2xs cursor-pointer"
              title="Delete all products in catalog to start fresh"
            >
              <span>🗑️</span> Purge All
            </button>
            <button
              onClick={() => setBulkUploadModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#141416] hover:bg-[#25262B] text-white transition-all shadow-xs cursor-pointer"
            >
              <span>📤</span> Bulk Upload
            </button>
            <Link
              href="/admin/products/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white shadow-xs transition-all hover:brightness-110 cursor-pointer bg-[#C59B27]"
            >
              <span>+</span> Add Garment
            </Link>
          </div>
        </div>

        {/* Filter & View Mode Command Bar */}
        <div className="p-3 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            {/* Search Input */}
            <div className="sm:col-span-4 relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search garments, SKU, fabric, brand…"
                className="w-full pl-9 pr-4 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-hidden focus:border-[#141416] transition-all font-medium"
              />
              <span className="absolute left-3 top-2 text-slate-400 text-xs">🔍</span>
            </div>

            {/* Department Filter */}
            <div className="sm:col-span-3">
              <select
                value={selectedDepartment}
                onChange={(e) => {
                  setSelectedDepartment(e.target.value);
                  setSelectedSubcategory("ALL");
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-hidden focus:border-[#141416] transition-all font-semibold"
              >
                <option value="ALL">📁 All Departments ({departments.length})</option>
                {departments.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    📁 {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subcategory Filter */}
            <div className="sm:col-span-3">
              <select
                value={selectedSubcategory}
                onChange={(e) => {
                  setSelectedSubcategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-hidden focus:border-[#141416] transition-all font-semibold"
              >
                <option value="ALL">✨ All Subcategories ({subcategories.length})</option>
                {subcategories.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    ↳ {sub.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Stock Level Filter */}
            <div className="sm:col-span-2">
              <select
                value={selectedStockFilter}
                onChange={(e) => {
                  setSelectedStockFilter(e.target.value as "ALL" | "LOW" | "OUT" | "IN");
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-hidden focus:border-[#141416] transition-all font-semibold"
              >
                <option value="ALL">📦 All Stock</option>
                <option value="IN">In Stock (&gt;0)</option>
                <option value="LOW">Low Stock (≤5)</option>
                <option value="OUT">Out of Stock (0)</option>
              </select>
            </div>
          </div>

          {/* Status Pills & View Mode Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-slate-100 text-xs">
            {/* Status Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-bold text-slate-400 mr-1 text-[10px] uppercase tracking-wider">Status:</span>
              {(["ALL", "ACTIVE", "DRAFT", "ARCHIVED"] as const).map((st) => {
                const count = st === "ALL" ? products.length : products.filter((p) => p.status === st).length;
                const isSelected = selectedStatus === st;
                return (
                  <button
                    key={st}
                    onClick={() => {
                      setSelectedStatus(st);
                      setCurrentPage(1);
                    }}
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#141416] text-white shadow-2xs"
                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {st} ({count})
                  </button>
                );
              })}
            </div>

            {/* View Mode Toggle Switch */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">
                Showing {filtered.length} garments
              </span>

              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100 p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode("GRID")}
                  className={`flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === "GRID"
                      ? "bg-white text-[#141416] shadow-2xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                  title="Wrapped Card Grid View"
                >
                  <span>⊞</span>
                  <span>Grid</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("TABLE")}
                  className={`flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === "TABLE"
                      ? "bg-white text-[#141416] shadow-2xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                  title="Dense Data Table View"
                >
                  <span>☰</span>
                  <span>Table</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Selection & Page Limit Selector */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-1 text-xs text-slate-500 font-semibold">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={allFilteredSelected}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-slate-300 accent-[#141416] cursor-pointer"
              />
              <span>Select all {paginatedProducts.length} garments on this page</span>
            </label>

            <div className="flex items-center gap-2">
              <span>Show:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-0.5 rounded-lg border border-slate-200 text-xs bg-white font-bold"
              >
                <option value={12}>12 / page</option>
                <option value={24}>24 / page</option>
                <option value={48}>48 / page</option>
                <option value={100}>100 / page</option>
              </select>
            </div>
          </div>
        )}

        {/* Floating Bulk Action Bar */}
        {selectedIds.size > 0 && (
          <div className="p-2.5 rounded-2xl bg-[#141416] text-white shadow-2xl flex flex-wrap items-center justify-between gap-2 border border-slate-700 animate-in slide-in-from-top-2 duration-150">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#C59B27] font-mono text-xs font-bold text-black">
                {selectedIds.size}
              </span>
              <span className="text-xs font-bold">
                {selectedIds.size} {selectedIds.size === 1 ? "garment" : "garments"} selected
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => handleBulkAction("ACTIVATE")}
                disabled={bulkActionLoading}
                className="px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shadow-xs"
              >
                🟢 Activate
              </button>

              <button
                onClick={() => handleBulkAction("DRAFT")}
                disabled={bulkActionLoading}
                className="px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-colors cursor-pointer shadow-xs"
              >
                👁️ Draft / Hide
              </button>

              <button
                onClick={() => handleBulkAction("ARCHIVE")}
                disabled={bulkActionLoading}
                className="px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-700 hover:bg-slate-600 text-white transition-colors cursor-pointer shadow-xs"
              >
                📦 Archive
              </button>

              {/* Move to Category */}
              <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-xl border border-slate-700">
                <select
                  value={targetMoveCategoryId}
                  onChange={(e) => {
                    setTargetMoveCategoryId(e.target.value);
                    if (e.target.value) {
                      handleBulkAction("CHANGE_CATEGORY", e.target.value);
                    }
                  }}
                  className="text-xs bg-transparent text-white px-2 py-0.5 focus:outline-hidden"
                >
                  <option value="" className="bg-slate-900 text-white">📁 Move to Category…</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                      {c.parentId ? `↳ ${c.name}` : `📁 ${c.name}`}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => setBulkDeleteModalOpen(true)}
                disabled={bulkActionLoading}
                className="px-2.5 py-1 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer shadow-xs"
              >
                🗑️ Delete Selected
              </button>

              <button
                onClick={() => setSelectedIds(new Set())}
                className="px-2 py-1 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                ✕ Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. DEDICATED PRODUCTS SCROLLABLE VIEWPORT (Only Products Scroll) */}
      <div className="flex-1 overflow-y-auto min-h-0 pr-1.5 pb-2 no-scrollbar">
        {/* WRAPPED CARD SHOWCASE GRID VIEW (Default) */}
        {viewMode === "GRID" ? (
          paginatedProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {paginatedProducts.map((product) => {
              const primaryImage = normalizeImageUrl(product.images[0]?.imageUrl) || "/placeholder-garment.jpg";
              const isSelected = selectedIds.has(product.id);
              const prices = product.variants.map((v) => Number(v.price));
              const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
              const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
              const totalStock = product.variants.reduce((acc, v) => acc + v.stockQuantity, 0);

              return (
                <div
                  key={product.id}
                  className={`group relative rounded-2xl bg-white border p-3 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all duration-200 ${
                    isSelected ? "border-[#C59B27] ring-2 ring-[#C59B27]/30 bg-[#FAF8F5]" : "border-slate-200 hover:border-[#C59B27]"
                  }`}
                >
                  {/* Top Image Container with Badges */}
                  <div>
                    <div className="relative h-56 w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-100 group/img">
                      <Image
                        src={primaryImage}
                        alt={product.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                        className="object-cover transition-transform duration-300 group-hover/img:scale-105"
                      />

                      {/* Top Selection Checkbox */}
                      <div className="absolute top-2 left-2 z-10">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(product.id)}
                          className="w-5 h-5 rounded border-white shadow-md accent-[#141416] cursor-pointer bg-white/90"
                        />
                      </div>

                      {/* Top Status Badge */}
                      <div className="absolute top-2 right-2 z-10">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider shadow-xs ${
                            product.status === "ACTIVE"
                              ? "bg-emerald-600 text-white"
                              : product.status === "DRAFT"
                              ? "bg-amber-500 text-white"
                              : "bg-slate-700 text-white"
                          }`}
                        >
                          {product.status}
                        </span>
                      </div>

                      {/* Quick Storefront Preview Overlay Button */}
                      <a
                        href={`/products/${product.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-black/75 hover:bg-black text-white text-[10px] font-bold flex items-center gap-1 opacity-0 group-hover/img:opacity-100 transition-opacity backdrop-blur-xs shadow-md"
                        title="Preview garment on live store"
                      >
                        <span>👁️ Preview</span>
                        <span>↗</span>
                      </a>
                    </div>

                    {/* Product Metadata & Info */}
                    <div className="pt-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#C59B27] truncate max-w-[160px]">
                          {product.category?.name || "Uncategorized"}
                        </span>
                        <span
                          className={`text-[10px] font-bold font-mono px-1.5 py-0.2 rounded-md ${
                            totalStock === 0
                              ? "bg-rose-50 text-rose-700"
                              : totalStock <= 5
                              ? "bg-amber-50 text-amber-800"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {totalStock} in stock
                        </span>
                      </div>

                      <Link
                        href={`/admin/products/${product.id}`}
                        className="font-bold text-xs text-slate-900 hover:text-[#C59B27] transition-colors line-clamp-2 leading-snug block"
                      >
                        {product.name}
                      </Link>

                      <p className="text-[11px] text-slate-500 truncate">
                        {product.fabric ? `Fabric: ${product.fabric}` : product.brand ? `Brand: ${product.brand}` : "Atelier Collection"}
                      </p>
                    </div>
                  </div>

                  {/* Price & Variant Chips & Action Buttons */}
                  <div className="pt-3 mt-2 border-t border-slate-100 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="font-mono text-sm font-black text-slate-900">
                        {minPrice === maxPrice
                          ? formatINR(minPrice)
                          : `${formatINR(minPrice)} - ${formatINR(maxPrice)}`}
                      </div>

                      {/* Variant Size Pills */}
                      <div className="flex items-center gap-1">
                        {product.variants.slice(0, 3).map((v) => (
                          <span
                            key={v.id}
                            className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200"
                          >
                            {v.size}
                          </span>
                        ))}
                        {product.variants.length > 3 && (
                          <span className="text-[9px] text-slate-400 font-bold">
                            +{product.variants.length - 3}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons Row */}
                    <div className="grid grid-cols-4 gap-1.5 pt-1">
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="col-span-2 py-1.5 px-2 rounded-xl bg-[#141416] hover:bg-[#25262B] text-white text-xs font-bold text-center transition-colors flex items-center justify-center gap-1 shadow-2xs"
                      >
                        <span>✏️</span>
                        <span>Edit</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => duplicateProduct(product.id)}
                        disabled={actionLoading === `dup-${product.id}`}
                        className="py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors flex items-center justify-center cursor-pointer"
                        title="Duplicate Listing"
                      >
                        {actionLoading === `dup-${product.id}` ? "…" : "📋"}
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteModalProduct(product)}
                        className="py-1.5 rounded-xl border border-slate-200 hover:bg-rose-50 text-xs font-bold text-rose-600 transition-colors flex items-center justify-center cursor-pointer"
                        title="Delete / Archive"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center space-y-3">
            <p className="text-4xl">👗</p>
            <h3 className="font-bold text-sm text-slate-800">No garments match your filters</h3>
            <p className="text-xs text-slate-500">Try changing department, subcategory, or clearing search keywords.</p>
          </div>
        )
      ) : (
        /* DENSE TABLE VIEW */
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 uppercase font-bold text-[10px] tracking-wider text-slate-500">
                <tr>
                  <th className="p-3 w-10">
                    <input
                      type="checkbox"
                      checked={allFilteredSelected}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-slate-300 accent-[#141416]"
                    />
                  </th>
                  <th className="px-3 py-3">Garment Details</th>
                  <th className="px-3 py-3">Department &amp; Subcategory</th>
                  <th className="px-3 py-3">Fabric &amp; Brand</th>
                  <th className="px-3 py-3">Variants</th>
                  <th className="px-3 py-3">Stock</th>
                  <th className="px-3 py-3">Price</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedProducts.map((product) => {
                  const primaryImage = normalizeImageUrl(product.images[0]?.imageUrl) || "/placeholder-garment.jpg";
                  const isSelected = selectedIds.has(product.id);
                  const prices = product.variants.map((v) => Number(v.price));
                  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
                  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
                  const totalStock = product.variants.reduce((acc, v) => acc + v.stockQuantity, 0);

                  return (
                    <tr
                      key={product.id}
                      className={`hover:bg-slate-50/70 transition-colors group ${
                        isSelected ? "bg-amber-500/5 font-semibold" : ""
                      }`}
                    >
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(product.id)}
                          className="w-4 h-4 rounded border-slate-300 accent-[#141416]"
                        />
                      </td>

                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-10 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-slate-100">
                            <Image src={primaryImage} alt="" fill className="object-cover" />
                          </div>
                          <div>
                            <Link
                              href={`/admin/products/${product.id}`}
                              className="font-bold text-xs text-slate-900 hover:text-[#C59B27] transition-colors line-clamp-1"
                            >
                              {product.name}
                            </Link>
                            <span className="font-mono text-[10px] text-slate-400 block">{product.slug}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-3">
                        <p className="font-bold text-slate-900 text-xs">
                          {product.category?.name || "Uncategorized"}
                        </p>
                      </td>

                      <td className="px-3 py-3 text-slate-600">
                        {product.fabric || product.brand || "Atelier"}
                      </td>

                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-1">
                          {product.variants.slice(0, 3).map((v) => (
                            <span key={v.id} className="px-1.5 py-0.5 rounded text-[10px] font-mono border bg-slate-50 border-slate-200">
                              {v.size}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="px-3 py-3 font-mono font-bold">
                        {totalStock}
                      </td>

                      <td className="px-3 py-3 font-mono font-bold text-slate-900">
                        {formatINR(minPrice)}
                      </td>

                      <td className="px-3 py-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200">
                          {product.status}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/admin/products/${product.id}`}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs"
                            title="Edit"
                          >
                            ✏️
                          </Link>
                          <button
                            onClick={() => duplicateProduct(product.id)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs"
                            title="Duplicate"
                          >
                            📋
                          </button>
                          <button
                            onClick={() => setDeleteModalProduct(product)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-xs text-rose-600"
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </div>

      {/* 3. PINNED BOTTOM PAGINATION BAR (Fixed at Bottom) */}
      {totalPages > 1 && (
        <div className="shrink-0 flex items-center justify-between px-4 py-2 rounded-2xl border border-slate-200 bg-white text-xs font-semibold text-slate-600 shadow-2xs">
          <span>
            Page {currentPage} of {totalPages} ({filtered.length} garments total)
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer text-xs"
            >
              ← Prev
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
              .map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-7 h-7 rounded-xl font-bold transition-all cursor-pointer text-xs ${
                    currentPage === page
                      ? "bg-[#141416] text-white shadow-2xs"
                      : "border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {page}
                </button>
              ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer text-xs"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Individual Delete / Archive Modal */}
      {deleteModalProduct && (
        <div className="fixed inset-0 z-50 p-4 flex items-center justify-center animate-in fade-in duration-150">
          <div onClick={() => setDeleteModalProduct(null)} className="fixed inset-0 bg-black/70 backdrop-blur-xs" />
          <div className="relative w-full max-w-md rounded-3xl p-6 bg-white border border-slate-200 shadow-2xl space-y-4 z-10 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🗑️</span>
              <div>
                <h3 className="font-display text-lg font-bold text-rose-600">Delete / Archive Garment</h3>
                <p className="text-xs text-slate-500 line-clamp-1">{deleteModalProduct.name}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              How would you like to handle this product? Archiving hides it from customers while safely preserving historical order records.
            </p>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => confirmDelete(false)}
                disabled={!!actionLoading}
                className="w-full py-2.5 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white transition-all shadow-xs cursor-pointer"
              >
                📦 Soft Archive (Recommended)
              </button>

              <button
                onClick={() => confirmDelete(true)}
                disabled={!!actionLoading}
                className="w-full py-2.5 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-xs cursor-pointer"
              >
                🗑️ Permanently Delete from Database
              </button>

              <button
                onClick={() => setDeleteModalProduct(null)}
                className="w-full py-2 rounded-xl text-xs text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Modal */}
      {bulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 p-4 flex items-center justify-center animate-in fade-in duration-150">
          <div onClick={() => setBulkDeleteModalOpen(false)} className="fixed inset-0 bg-black/70 backdrop-blur-xs" />
          <div className="relative w-full max-w-md rounded-3xl p-6 bg-white border border-slate-200 shadow-2xl space-y-4 z-10 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <span className="text-3xl">⚠️</span>
              <div>
                <h3 className="font-display text-lg font-bold text-rose-600">Delete {selectedIds.size} Garments</h3>
                <p className="text-xs text-slate-500">Bulk delete operation</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete or archive all {selectedIds.size} selected products? Products with customer order history will be automatically archived to preserve invoices.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => setBulkDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleBulkAction("DELETE")}
                disabled={bulkActionLoading}
                className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-md cursor-pointer"
              >
                {bulkActionLoading ? "Processing…" : `Confirm Delete (${selectedIds.size})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Product CSV Upload Modal */}
      <BulkProductUploadModal
        isOpen={bulkUploadModalOpen}
        onClose={() => setBulkUploadModalOpen(false)}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </div>
  );
}
