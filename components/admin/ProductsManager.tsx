"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { formatINR } from "@/lib/format";
import { useToast } from "@/components/providers/ToastProvider";
import DownloadCsvButton from "./DownloadCsvButton";
import BulkProductUploadModal from "./BulkProductUploadModal";

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

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [targetMoveCategoryId, setTargetMoveCategoryId] = useState("");

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteModalProduct, setDeleteModalProduct] = useState<ProductItem | null>(null);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [bulkUploadModalOpen, setBulkUploadModalOpen] = useState(false);

  // Departments (parentId === null) and Subcategories (parentId !== null)
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
    if (selectedStatus !== "ALL" && p.status !== selectedStatus) {
      return false;
    }

    // Stock match
    const totalStock = p.variants.reduce((sum, v) => sum + v.stockQuantity, 0);
    if (selectedStockFilter === "OUT" && totalStock > 0) return false;
    if (selectedStockFilter === "LOW" && (totalStock === 0 || totalStock > 5)) return false;
    if (selectedStockFilter === "IN" && totalStock === 0) return false;

    return true;
  });

  // Checkbox selection helpers
  const allFilteredSelected = filtered.length > 0 && filtered.every((p) => selectedIds.has(p.id));
  const someFilteredSelected = filtered.some((p) => selectedIds.has(p.id));

  function toggleSelectAll() {
    if (allFilteredSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((p) => p.id)));
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

      const data = await res.json();
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
      const data = await res.json();
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
    <div className="space-y-6">
      {/* Top Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold flex items-center gap-2 text-slate-900">
            <span>👗</span> Catalog &amp; Products Manager
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Full management of luxury catalog, bulk actions, subcategory filters, stock, and pricing ({products.length} total garments)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <DownloadCsvButton type="template" label="CSV Template" icon="📋" />
          <DownloadCsvButton type="products" label="Export Catalog CSV" icon="📥" />
          <button
            onClick={() => setBulkUploadModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#141416] hover:bg-[#25262B] text-white transition-all shadow-sm cursor-pointer"
          >
            <span>📤</span> Bulk Upload CSV
          </button>
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all hover:brightness-110 cursor-pointer"
            style={{ backgroundColor: "var(--fc-primary)" }}
          >
            <span>✨</span> + Add Luxury Garment
          </Link>
        </div>
      </div>

      {/* Filter & Search Bar with Department + Subcategory selectors */}
      <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Keyword Search */}
          <div className="sm:col-span-4 relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">🔍</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search title, SKU, fabric (e.g. Silk, Banarasi, FC-PRD)..."
              className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50/50 focus:outline-hidden focus:border-[#141416] transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-900 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Department Category Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedDepartment}
              onChange={(e) => {
                setSelectedDepartment(e.target.value);
                setSelectedSubcategory("ALL");
              }}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50/50 focus:outline-hidden focus:border-[#141416] transition-all"
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
              onChange={(e) => setSelectedSubcategory(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50/50 focus:outline-hidden focus:border-[#141416] transition-all"
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
              onChange={(e) => setSelectedStockFilter(e.target.value as "ALL" | "LOW" | "OUT" | "IN")}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50/50 focus:outline-hidden focus:border-[#141416] transition-all"
            >
              <option value="ALL">📦 All Stock</option>
              <option value="IN">In Stock (&gt;0)</option>
              <option value="LOW">Low Stock (≤5)</option>
              <option value="OUT">Out of Stock (0)</option>
            </select>
          </div>
        </div>

        {/* Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs border-t border-slate-100">
          <span className="font-bold text-slate-400 mr-1 text-[11px] uppercase tracking-wider">Status:</span>
          {(["ALL", "ACTIVE", "DRAFT", "ARCHIVED"] as const).map((st) => {
            const count = st === "ALL" ? products.length : products.filter((p) => p.status === st).length;
            const isSelected = selectedStatus === st;
            return (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#141416] text-white shadow-xs"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {st} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Floating / Sticky Bulk Action Command Bar */}
      {selectedIds.size > 0 && (
        <div className="sticky top-20 z-30 p-3.5 rounded-2xl bg-[#141416] text-white shadow-2xl flex flex-wrap items-center justify-between gap-3 border border-slate-700 animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#C59B27] font-mono text-xs font-bold text-black">
              {selectedIds.size}
            </span>
            <span className="text-xs font-bold">
              {selectedIds.size} {selectedIds.size === 1 ? "product" : "products"} selected
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Activate */}
            <button
              onClick={() => handleBulkAction("ACTIVATE")}
              disabled={bulkActionLoading}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shadow-xs"
            >
              🟢 Activate All
            </button>

            {/* Set to Draft / Hide */}
            <button
              onClick={() => handleBulkAction("DRAFT")}
              disabled={bulkActionLoading}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-colors cursor-pointer shadow-xs"
            >
              👁️ Set to Draft / Hide
            </button>

            {/* Archive */}
            <button
              onClick={() => handleBulkAction("ARCHIVE")}
              disabled={bulkActionLoading}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-700 hover:bg-slate-600 text-white transition-colors cursor-pointer shadow-xs"
            >
              📦 Archive
            </button>

            {/* Move to Category */}
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
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

            {/* Delete */}
            <button
              onClick={() => setBulkDeleteModalOpen(true)}
              disabled={bulkActionLoading}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer shadow-xs"
            >
              🗑️ Delete Selected
            </button>

            {/* Deselect All */}
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              ✕ Deselect
            </button>
          </div>
        </div>
      )}

      {/* Interactive Products Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 uppercase font-bold text-[10px] tracking-wider text-slate-500">
              <tr>
                {/* Select All Checkbox */}
                <th className="px-4 py-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someFilteredSelected && !allFilteredSelected;
                    }}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer"
                    title="Select / Deselect all visible products"
                  />
                </th>
                <th className="px-3 py-3.5">Garment / Item</th>
                <th className="px-3 py-3.5">Department &amp; Subcategory</th>
                <th className="px-3 py-3.5">Fabric &amp; Details</th>
                <th className="px-3 py-3.5">Variants &amp; SKU</th>
                <th className="px-3 py-3.5">Total Stock</th>
                <th className="px-3 py-3.5">Price Range</th>
                <th className="px-3 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions &amp; Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((product) => {
                const isSelected = selectedIds.has(product.id);
                const totalStock = product.variants.reduce((sum, v) => sum + v.stockQuantity, 0);
                const prices = product.variants.map((v) => v.price);
                const minPrice = prices.length ? Math.min(...prices) : 0;
                const maxPrice = prices.length ? Math.max(...prices) : 0;
                const primaryImage =
                  product.images[0]?.imageUrl ||
                  "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=200&auto=format&fit=crop&q=80";

                return (
                  <tr
                    key={product.id}
                    className={`hover:bg-slate-50/80 transition-colors group ${
                      isSelected ? "bg-amber-50/40" : ""
                    }`}
                  >
                    {/* Row Checkbox */}
                    <td className="px-4 py-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(product.id)}
                        className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer"
                      />
                    </td>

                    {/* Image & Title */}
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="relative h-14 w-11 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-slate-100 shadow-2xs group-hover:scale-105 transition-transform">
                          <Image src={primaryImage} alt="" fill className="object-cover" />
                        </div>
                        <div>
                          <Link
                            href={`/admin/products/${product.id}`}
                            className="font-bold text-xs text-slate-900 hover:text-[#C59B27] transition-colors line-clamp-1"
                          >
                            {product.name}
                          </Link>
                          <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500">
                            <span className="font-mono text-[10px] text-slate-400">{product.slug}</span>
                            <a
                              href={`/products/${product.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#C59B27] hover:underline inline-flex items-center gap-0.5 font-semibold cursor-pointer"
                              title="Preview product on live store"
                            >
                              <span>↗</span> Preview
                            </a>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Department & Subcategory Hierarchy */}
                    <td className="px-3 py-3.5">
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-900 text-[11px]">
                          {product.category?.parent?.name || product.category?.name || "Uncategorized"}
                        </p>
                        {product.category?.parent && (
                          <p className="text-[10px] text-[#C59B27] font-medium">
                            ↳ {product.category.name}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Fabric & Brand */}
                    <td className="px-3 py-3.5">
                      <p className="font-medium text-[11px] text-slate-800 line-clamp-1">
                        {product.fabric || "Pure Fabric"}
                      </p>
                      <p className="text-[10px] text-slate-400">{product.brand || "Atelier Signature"}</p>
                    </td>

                    {/* Variants & SKU Preview */}
                    <td className="px-3 py-3.5">
                      <div className="flex flex-wrap gap-1 max-w-[160px]">
                        {product.variants.slice(0, 3).map((v) => (
                          <span
                            key={v.id}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${
                              v.isActive
                                ? "bg-slate-50 text-slate-700 border-slate-200"
                                : "bg-slate-100 text-slate-400 border-slate-200 line-through"
                            }`}
                          >
                            {v.size}
                          </span>
                        ))}
                        {product.variants.length > 3 && (
                          <span className="text-[10px] text-slate-400 font-bold self-center">
                            +{product.variants.length - 3} more
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Stock */}
                    <td className="px-3 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-xs font-bold ${
                          totalStock === 0
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : totalStock <= 5
                            ? "bg-amber-50 text-amber-800 border border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {totalStock} units
                      </span>
                    </td>

                    {/* Price Range */}
                    <td className="px-3 py-3.5">
                      <p className="font-bold text-slate-900 text-xs font-mono">
                        {minPrice === maxPrice
                          ? formatINR(minPrice)
                          : `${formatINR(minPrice)} - ${formatINR(maxPrice)}`}
                      </p>
                    </td>

                    {/* Status Pill */}
                    <td className="px-3 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          product.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : product.status === "DRAFT"
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : "bg-slate-100 text-slate-500 border-slate-200"
                        }`}
                      >
                        ● {product.status}
                      </span>
                    </td>

                    {/* Actions & Controls */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs transition-colors cursor-pointer"
                          title="Edit product, stock & variants"
                        >
                          ✏️
                        </Link>

                        <button
                          onClick={() => duplicateProduct(product.id)}
                          disabled={actionLoading === `dup-${product.id}`}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs transition-colors cursor-pointer"
                          title="Duplicate garment listing"
                        >
                          {actionLoading === `dup-${product.id}` ? "…" : "📋"}
                        </button>

                        <button
                          onClick={() => setDeleteModalProduct(product)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-xs text-rose-600 transition-colors cursor-pointer"
                          title="Delete / Archive garment"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center text-slate-400 space-y-2">
                    <p className="text-4xl">👗</p>
                    <p className="font-bold text-sm text-slate-800">No garments found matching your filters.</p>
                    <p className="text-xs">Try selecting a different department or resetting filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Individual Delete / Archive Modal */}
      {deleteModalProduct && (
        <div className="fixed inset-0 z-50 p-4 flex items-center justify-center animate-in fade-in duration-150">
          <div onClick={() => setDeleteModalProduct(null)} className="fixed inset-0 bg-black/70 backdrop-blur-xs" />
          <div className="relative w-full max-w-md rounded-3xl p-6 bg-white border border-slate-200 shadow-2xl space-y-4 z-10 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🗑️</span>
              <div>
                <h3 className="font-display text-lg font-bold text-rose-600">Delete / Archive Garment</h3>
                <p className="text-xs text-slate-500">{deleteModalProduct.name}</p>
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
