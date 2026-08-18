"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { formatINR } from "@/lib/format";
import { useToast } from "@/components/providers/ToastProvider";
import DownloadCsvButton from "./DownloadCsvButton";

type ProductItem = {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  fabric: string | null;
  status: "ACTIVE" | "ARCHIVED" | "DRAFT";
  category: { id: string; name: string } | null;
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

type CategoryOption = { id: string; name: string };

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
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState<"ALL" | "ACTIVE" | "DRAFT" | "ARCHIVED">("ALL");
  const [selectedStockFilter, setSelectedStockFilter] = useState<"ALL" | "LOW" | "OUT" | "IN">("ALL");

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteModalProduct, setDeleteModalProduct] = useState<ProductItem | null>(null);

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

    // Category match
    if (selectedCategory !== "ALL" && p.category?.id !== selectedCategory) {
      return false;
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

  // Duplicate Product Action
  async function handleDuplicate(productId: string) {
    setActionLoading(`dup-${productId}`);
    try {
      const res = await fetch(`/api/admin/products/${productId}/duplicate`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to duplicate");

      success("Product Duplicated! 📋", `Created draft clone: "${data.product.name}"`);
      router.refresh();
      // Reload products list
      window.location.reload();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error duplicating product";
      toastError("Duplication Failed", msg);
    } finally {
      setActionLoading(null);
    }
  }

  // Toggle Status (ACTIVE <-> DRAFT <-> ARCHIVED)
  async function handleStatusToggle(product: ProductItem, newStatus: "ACTIVE" | "DRAFT" | "ARCHIVED") {
    setActionLoading(`status-${product.id}`);
    try {
      const res = await fetch(`/api/products/${product.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");

      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, status: newStatus } : p))
      );
      success("Status Updated", `"${product.name}" is now marked as ${newStatus}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error updating status";
      toastError("Update Failed", msg);
    } finally {
      setActionLoading(null);
    }
  }

  // Confirm Delete Action
  async function confirmDelete(hard: boolean) {
    if (!deleteModalProduct) return;
    const prodId = deleteModalProduct.id;
    setActionLoading(`del-${prodId}`);

    try {
      const res = await fetch(`/api/admin/products/${prodId}/delete?hard=${hard}`, {
        method: "DELETE",
      });
      const data = await res.json();
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
          <h1 className="font-display text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <span>👗</span> Catalog &amp; Products
          </h1>
          <p className="text-xs text-dim mt-0.5">
            Full management of luxury catalog, stock quantities, variants, and pricing ({products.length} total garments)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <DownloadCsvButton type="products" label="Export Products CSV" />
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all hover:brightness-110 cursor-pointer"
            style={{ backgroundColor: "var(--fc-primary)" }}
          >
            <span>✨</span> + Add Luxury Garment
          </Link>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div
        className="p-4 rounded-2xl border space-y-3"
        style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search */}
          <div className="sm:col-span-6 relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-dim">🔍</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title, SKU, fabric (e.g. Silk, Banarasi, FC-PRD)..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-xs outline-none focus:border-primary transition-all"
              style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-dim hover:text-primary"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border text-xs outline-none focus:border-primary transition-all"
              style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}
            >
              <option value="ALL">All Categories ({categories.length})</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedStockFilter}
              onChange={(e) => setSelectedStockFilter(e.target.value as "ALL" | "LOW" | "OUT" | "IN")}
              className="w-full px-3 py-2.5 rounded-xl border text-xs outline-none focus:border-primary transition-all"
              style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}
            >
              <option value="ALL">All Stock Levels</option>
              <option value="IN">In Stock (Available)</option>
              <option value="LOW">Low Stock (≤ 5 units)</option>
              <option value="OUT">Out of Stock (0 units)</option>
            </select>
          </div>
        </div>

        {/* Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
          <span className="font-bold text-dim mr-1 text-[11px] uppercase tracking-wider">Status:</span>
          {(["ALL", "ACTIVE", "DRAFT", "ARCHIVED"] as const).map((st) => {
            const count = st === "ALL" ? products.length : products.filter((p) => p.status === st).length;
            const isSelected = selectedStatus === st;
            return (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-amber-600 text-white shadow-xs"
                    : "border opacity-70 hover:opacity-100"
                }`}
                style={{
                  borderColor: isSelected ? "transparent" : "var(--fc-border)",
                  backgroundColor: isSelected ? "var(--fc-primary)" : "var(--fc-bg)",
                }}
              >
                {st} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Products Table */}
      <div
        className="rounded-2xl border overflow-hidden shadow-xs"
        style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead
              className="border-b uppercase font-bold text-[10px] tracking-wider"
              style={{ backgroundColor: "var(--fc-bg-subtle)", borderColor: "var(--fc-border)", color: "var(--fc-text-dim)" }}
            >
              <tr>
                <th className="px-4 py-3.5">Garment / Item</th>
                <th className="px-3 py-3.5">Category</th>
                <th className="px-3 py-3.5">Fabric &amp; Details</th>
                <th className="px-3 py-3.5">Variants &amp; SKU</th>
                <th className="px-3 py-3.5">Total Stock</th>
                <th className="px-3 py-3.5">Price Range</th>
                <th className="px-3 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions &amp; Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "var(--fc-border)" }}>
              {filtered.map((product) => {
                const totalStock = product.variants.reduce((sum, v) => sum + v.stockQuantity, 0);
                const prices = product.variants.map((v) => v.price);
                const minPrice = prices.length ? Math.min(...prices) : 0;
                const maxPrice = prices.length ? Math.max(...prices) : 0;
                const primaryImage = product.images[0]?.imageUrl || "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=200&auto=format&fit=crop&q=80";

                return (
                  <tr
                    key={product.id}
                    className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
                  >
                    {/* Image & Title */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="relative h-14 w-11 rounded-lg overflow-hidden border shrink-0 bg-neutral-100 shadow-2xs group-hover:scale-105 transition-transform" style={{ borderColor: "var(--fc-border)" }}>
                          <Image src={primaryImage} alt="" fill className="object-cover" />
                        </div>
                        <div>
                          <Link
                            href={`/admin/products/${product.id}`}
                            className="font-bold text-xs hover:text-amber-600 transition-colors line-clamp-1"
                            style={{ color: "var(--fc-text)" }}
                          >
                            {product.name}
                          </Link>
                          <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-dim">
                            <span className="font-mono text-[10px] text-primary">{product.slug}</span>
                            <a
                              href={`/products/${product.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-amber-600 hover:underline inline-flex items-center gap-0.5"
                              title="Preview on live store"
                            >
                              <span>↗</span> Preview
                            </a>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-3 py-3.5">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                        {product.category?.name || "Uncategorized"}
                      </span>
                    </td>

                    {/* Fabric & Brand */}
                    <td className="px-3 py-3.5">
                      <p className="font-medium text-[11px] line-clamp-1">{product.fabric || "Pure Fabric"}</p>
                      <p className="text-[10px] text-dim">{product.brand || "Atelier Signature"}</p>
                    </td>

                    {/* Variants */}
                    <td className="px-3 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {product.variants.slice(0, 3).map((v) => (
                          <span
                            key={v.id}
                            className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-neutral-100 dark:bg-neutral-800"
                            title={`SKU: ${v.sku} | Qty: ${v.stockQuantity}`}
                          >
                            {v.size}
                          </span>
                        ))}
                        {product.variants.length > 3 && (
                          <span className="text-[10px] text-dim font-bold">+{product.variants.length - 3}</span>
                        )}
                      </div>
                    </td>

                    {/* Stock Quantity Badge */}
                    <td className="px-3 py-3.5">
                      {totalStock === 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          ✕ Sold Out
                        </span>
                      ) : totalStock <= 5 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          ⚠️ Low ({totalStock})
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          ✓ {totalStock} units
                        </span>
                      )}
                    </td>

                    {/* Price Range */}
                    <td className="px-3 py-3.5 font-semibold font-mono text-xs">
                      {minPrice === maxPrice ? formatINR(minPrice) : `${formatINR(minPrice)} - ${formatINR(maxPrice)}`}
                    </td>

                    {/* Status Dropdown */}
                    <td className="px-3 py-3.5">
                      <select
                        value={product.status}
                        onChange={(e) => handleStatusToggle(product, e.target.value as "ACTIVE" | "DRAFT" | "ARCHIVED")}
                        disabled={actionLoading === `status-${product.id}`}
                        className="px-2 py-1 rounded-lg text-[11px] font-bold border outline-none cursor-pointer"
                        style={{
                          backgroundColor:
                            product.status === "ACTIVE"
                              ? "rgba(16, 185, 129, 0.1)"
                              : product.status === "DRAFT"
                              ? "rgba(245, 158, 11, 0.1)"
                              : "rgba(100, 116, 139, 0.1)",
                          color:
                            product.status === "ACTIVE"
                              ? "#059669"
                              : product.status === "DRAFT"
                              ? "#D97706"
                              : "#64748B",
                          borderColor: "var(--fc-border)",
                        }}
                      >
                        <option value="ACTIVE">● ACTIVE</option>
                        <option value="DRAFT">● DRAFT</option>
                        <option value="ARCHIVED">● ARCHIVED</option>
                      </select>
                    </td>

                    {/* Action Controls */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Edit */}
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="px-2.5 py-1.5 rounded-lg border text-[11px] font-bold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shadow-2xs"
                          style={{ borderColor: "var(--fc-border)" }}
                        >
                          ✏️ Edit
                        </Link>

                        {/* Duplicate */}
                        <button
                          onClick={() => handleDuplicate(product.id)}
                          disabled={actionLoading === `dup-${product.id}`}
                          title="Clone/Duplicate this product"
                          className="p-1.5 rounded-lg border text-[11px] font-bold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
                          style={{ borderColor: "var(--fc-border)" }}
                        >
                          📋
                        </button>

                        {/* Delete / Archive */}
                        <button
                          onClick={() => setDeleteModalProduct(product)}
                          title="Delete or Archive product"
                          className="p-1.5 rounded-lg border text-[11px] font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors shadow-2xs cursor-pointer"
                          style={{ borderColor: "var(--fc-border)" }}
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
                  <td colSpan={8} className="px-4 py-16 text-center text-dim space-y-2">
                    <p className="text-3xl">👗</p>
                    <p className="font-bold text-sm">No garments found matching your filters.</p>
                    <p className="text-xs">Try adjusting your search keywords or resetting filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete / Archive Modal */}
      {deleteModalProduct && (
        <div className="fixed inset-0 z-50 p-4 flex items-center justify-center animate-in fade-in duration-200">
          <div
            onClick={() => setDeleteModalProduct(null)}
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
          />
          <div
            className="relative w-full max-w-md rounded-2xl p-6 border shadow-2xl space-y-4 z-10 animate-in zoom-in-95"
            style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">🗑️</span>
              <div>
                <h3 className="font-display text-lg font-bold text-rose-600">Delete / Archive Garment</h3>
                <p className="text-xs text-dim">{deleteModalProduct.name}</p>
              </div>
            </div>

            <p className="text-xs text-dim leading-relaxed">
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
                className="w-full py-2 rounded-xl text-xs text-dim hover:text-primary transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
