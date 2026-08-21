"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatINR } from "@/lib/format";
import { useToast } from "@/components/providers/ToastProvider";

export type MappedProductItem = {
  id: string;
  productId: string | null;
  name: string;
  slug: string;
  brand: string | null;
  department: string | null;
  subcategory: string | null;
  categoryPath: string | null;
  productUrl: string | null;
  sellerId: string | null;
  sellerName: string | null;
  sellerIdentifier: string | null;
  sellerPhone: string | null;
  sellerEmail: string | null;
  sellerUrl: string | null;
  categoryName?: string | null;
  primaryImage: string;
  variants: {
    id: string;
    sku: string;
    colour: string;
    size: string;
    price: number;
    compareAtPrice: number | null;
    stockQuantity: number;
  }[];
  seller?: {
    id: string;
    sellerId: string;
    name: string;
    phone: string | null;
    email: string | null;
    url: string | null;
  } | null;
};

export type SellerDirectoryItem = {
  id: string;
  sellerId: string;
  name: string;
  phone: string | null;
  email: string | null;
  url: string | null;
  address: string | null;
  notes: string | null;
  isActive: boolean;
  productCount: number;
};

export default function SellersManager({
  initialProducts,
  initialSellers,
}: {
  initialProducts: MappedProductItem[];
  initialSellers: SellerDirectoryItem[];
}) {
  const { success, error: toastError } = useToast();

  const [products] = useState<MappedProductItem[]>(initialProducts);
  const [sellers, setSellers] = useState<SellerDirectoryItem[]>(initialSellers);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSellerFilter, setSelectedSellerFilter] = useState("ALL");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState<"MAPPING" | "SUPPLIERS">("MAPPING");

  // Supplier modal
  const [isSellerModalOpen, setIsSellerModalOpen] = useState(false);
  const [editingSeller, setEditingSeller] = useState<SellerDirectoryItem | null>(null);
  const [formSellerId, setFormSellerId] = useState("");
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [savingSeller, setSavingSeller] = useState(false);

  // Flattened mapping rows (Product x Variant)
  const flattenedRows = useMemo(() => {
    const rows: {
      rowId: string;
      productId: string;
      productMasterId: string;
      productName: string;
      slug: string;
      brand: string;
      categoryPath: string;
      imageUrl: string;
      sku: string;
      colour: string;
      size: string;
      price: number;
      stockQuantity: number;
      sellerName: string;
      sellerId: string;
      sellerPhone: string;
      sellerEmail: string;
      sellerUrl: string;
    }[] = [];

    for (const p of products) {
      const activeSellerName = p.seller?.name || p.sellerName || "Unassigned Supplier";
      const activeSellerId = p.seller?.sellerId || p.sellerIdentifier || "—";
      const activeSellerPhone = p.seller?.phone || p.sellerPhone || "";
      const activeSellerEmail = p.seller?.email || p.sellerEmail || "";
      const activeSellerUrl = p.seller?.url || p.sellerUrl || p.productUrl || "";
      const catPath = p.categoryPath || (p.department ? `${p.department} > ${p.subcategory || "General"}` : p.categoryName || "Catalog");

      if (p.variants.length === 0) {
        rows.push({
          rowId: `${p.id}-default`,
          productId: p.id,
          productMasterId: p.productId || `FC-PRD-${p.slug.slice(0, 8).toUpperCase()}`,
          productName: p.name,
          slug: p.slug,
          brand: p.brand || "Fashion Cart",
          categoryPath: catPath,
          imageUrl: p.primaryImage,
          sku: `FC-SKU-${p.slug.slice(0, 8).toUpperCase()}`,
          colour: "Standard",
          size: "Free Size",
          price: 0,
          stockQuantity: 0,
          sellerName: activeSellerName,
          sellerId: activeSellerId,
          sellerPhone: activeSellerPhone,
          sellerEmail: activeSellerEmail,
          sellerUrl: activeSellerUrl,
        });
      } else {
        for (const v of p.variants) {
          rows.push({
            rowId: `${p.id}-${v.id}`,
            productId: p.id,
            productMasterId: p.productId || `FC-PRD-${p.slug.slice(0, 8).toUpperCase()}`,
            productName: p.name,
            slug: p.slug,
            brand: p.brand || "Fashion Cart",
            categoryPath: catPath,
            imageUrl: p.primaryImage,
            sku: v.sku,
            colour: v.colour || "Standard",
            size: v.size || "Free Size",
            price: v.price,
            stockQuantity: v.stockQuantity,
            sellerName: activeSellerName,
            sellerId: activeSellerId,
            sellerPhone: activeSellerPhone,
            sellerEmail: activeSellerEmail,
            sellerUrl: activeSellerUrl,
          });
        }
      }
    }

    return rows;
  }, [products]);

  // Unique departments for filter
  const departments = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) {
      if (p.department) set.add(p.department);
    }
    return Array.from(set);
  }, [products]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return flattenedRows.filter((r) => {
      // Seller Filter
      if (selectedSellerFilter !== "ALL" && r.sellerName !== selectedSellerFilter && r.sellerId !== selectedSellerFilter) {
        return false;
      }
      // Department Filter
      if (selectedDeptFilter !== "ALL" && !r.categoryPath.toLowerCase().includes(selectedDeptFilter.toLowerCase())) {
        return false;
      }
      // Global Search
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        r.productMasterId.toLowerCase().includes(q) ||
        r.sku.toLowerCase().includes(q) ||
        r.productName.toLowerCase().includes(q) ||
        r.sellerName.toLowerCase().includes(q) ||
        r.sellerId.toLowerCase().includes(q) ||
        r.sellerPhone.includes(q) ||
        r.sellerEmail.toLowerCase().includes(q) ||
        r.brand.toLowerCase().includes(q) ||
        r.categoryPath.toLowerCase().includes(q) ||
        r.colour.toLowerCase().includes(q) ||
        r.size.toLowerCase().includes(q)
      );
    });
  }, [flattenedRows, searchQuery, selectedSellerFilter, selectedDeptFilter]);

  // Export to CSV
  function handleExportCsv() {
    const headers = [
      "ProductID",
      "SKU",
      "ProductTitle",
      "Brand",
      "CategoryPath",
      "Colour",
      "Size",
      "Price",
      "StockQuantity",
      "SellerName",
      "SellerID",
      "SellerPhone",
      "SellerEmail",
      "SellerURL",
    ];

    const csvLines = [headers.join(",")];

    for (const r of filteredRows) {
      const cleanField = (val: string | number) => `"${String(val || "").replace(/"/g, '""')}"`;
      const row = [
        cleanField(r.productMasterId),
        cleanField(r.sku),
        cleanField(r.productName),
        cleanField(r.brand),
        cleanField(r.categoryPath),
        cleanField(r.colour),
        cleanField(r.size),
        cleanField(r.price),
        cleanField(r.stockQuantity),
        cleanField(r.sellerName),
        cleanField(r.sellerId),
        cleanField(r.sellerPhone),
        cleanField(r.sellerEmail),
        cleanField(r.sellerUrl),
      ];
      csvLines.push(row.join(","));
    }

    const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fashion-cart-product-seller-mapping-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    success("Mapping Exported 🎉", `Downloaded ${filteredRows.length} mapped SKU records.`);
  }

  function openCreateSellerModal() {
    setEditingSeller(null);
    setFormSellerId(`SLR-${Date.now().toString().slice(-4)}`);
    setFormName("");
    setFormPhone("");
    setFormEmail("");
    setFormUrl("");
    setFormAddress("");
    setFormNotes("");
    setFormIsActive(true);
    setIsSellerModalOpen(true);
  }

  function openEditSellerModal(seller: SellerDirectoryItem) {
    setEditingSeller(seller);
    setFormSellerId(seller.sellerId);
    setFormName(seller.name);
    setFormPhone(seller.phone || "");
    setFormEmail(seller.email || "");
    setFormUrl(seller.url || "");
    setFormAddress(seller.address || "");
    setFormNotes(seller.notes || "");
    setFormIsActive(seller.isActive);
    setIsSellerModalOpen(true);
  }

  async function handleSaveSeller(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim() || !formSellerId.trim()) {
      toastError("Validation Error", "Supplier Name and ID are required.");
      return;
    }

    setSavingSeller(true);
    const payload = {
      sellerId: formSellerId.trim(),
      name: formName.trim(),
      phone: formPhone.trim() || null,
      email: formEmail.trim() || null,
      url: formUrl.trim() || null,
      address: formAddress.trim() || null,
      notes: formNotes.trim() || null,
      isActive: formIsActive,
    };

    try {
      const url = editingSeller ? `/api/admin/sellers/${editingSeller.id}` : `/api/admin/sellers`;
      const method = editingSeller ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setSavingSeller(false);

      if (!res.ok) {
        toastError("Save Failed", data.error || "Could not save supplier.");
        return;
      }

      success("Supplier Saved 🎉", `"${payload.name}" has been updated.`);
      setIsSellerModalOpen(false);

      if (editingSeller) {
        setSellers((prev) =>
          prev.map((s) => (s.id === editingSeller.id ? { ...s, ...payload } : s))
        );
      } else {
        setSellers((prev) => [
          { ...data.seller, productCount: 0 },
          ...prev,
        ]);
      }
    } catch {
      setSavingSeller(false);
      toastError("Error", "Network error while saving supplier.");
    }
  }

  return (
    <div className="h-full overflow-y-auto min-h-0 space-y-6 pr-1 pb-10">
      {/* Top Banner & KPI Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-[#E8E3D8] shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🏭</span>
            <h1 className="font-display text-xl sm:text-2xl font-bold text-[#0C3B2E]">
              Sellers &amp; Suppliers Directory
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FAF8F5] border border-[#E8E3D8] text-[#0C3B2E]">
              {flattenedRows.length} Mapped SKUs
            </span>
          </div>
          <p className="text-xs text-[#5B7A6F] mt-1">
            Realtime mapping of Product IDs, Variant SKUs, and respective supplier contact connections for seamless order fulfillment.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center bg-[#FAF8F5] border border-[#E8E3D8] p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setViewMode("MAPPING")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "MAPPING"
                  ? "bg-[#0C3B2E] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              📋 Product &amp; SKU Mapping ({flattenedRows.length})
            </button>
            <button
              onClick={() => setViewMode("SUPPLIERS")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "SUPPLIERS"
                  ? "bg-[#0C3B2E] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              🏭 Registered Suppliers ({sellers.length})
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs cursor-pointer"
          >
            <span>📥</span>
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={openCreateSellerModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#141416] hover:bg-[#25262B] text-white shadow-md transition-all cursor-pointer"
          >
            <span>+</span>
            <span>Add Supplier</span>
          </button>
        </div>
      </div>

      {/* Global Realtime Search & Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-[#E8E3D8] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Global Search Input */}
          <div className="flex-1 w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus-within:bg-white focus-within:border-[#0C3B2E] transition-all">
            <span className="text-slate-400">🔍</span>
            <input
              type="text"
              placeholder="Global Search by Product ID (FC-PRD-...), SKU (FC-SKU-...), Title, Seller Name, Seller ID (SLR-...), Phone, Category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs bg-transparent focus:outline-hidden text-slate-900 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-xs text-slate-400 hover:text-slate-700 px-1 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Supplier Dropdown Filter */}
          <div className="w-full sm:w-64">
            <select
              value={selectedSellerFilter}
              onChange={(e) => setSelectedSellerFilter(e.target.value)}
              className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-hidden focus:border-[#0C3B2E]"
            >
              <option value="ALL">All Suppliers ({sellers.length})</option>
              {sellers.map((s) => (
                <option key={s.id} value={s.name}>
                  🏭 {s.name} ({s.sellerId})
                </option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          {departments.length > 0 && (
            <div className="w-full sm:w-48">
              <select
                value={selectedDeptFilter}
                onChange={(e) => setSelectedDeptFilter(e.target.value)}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-hidden focus:border-[#0C3B2E]"
              >
                <option value="ALL">All Departments</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    📁 {d}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Active Filters Summary */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <p>
            Showing <strong>{viewMode === "MAPPING" ? filteredRows.length : sellers.length}</strong> records
            {searchQuery && (
              <span>
                {" "}
                matching &ldquo;<strong>{searchQuery}</strong>&rdquo;
              </span>
            )}
          </p>
          {(searchQuery || selectedSellerFilter !== "ALL" || selectedDeptFilter !== "ALL") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedSellerFilter("ALL");
                setSelectedDeptFilter("ALL");
              }}
              className="text-[11px] font-bold text-amber-700 hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === "MAPPING" ? (
        /* PRODUCT ID & SKU TO SELLER MAPPING TABLE */
        <div className="rounded-3xl bg-white border border-[#E8E3D8] shadow-xs overflow-hidden">
          {filteredRows.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <span className="text-4xl block">🔍</span>
              <h3 className="font-bold text-sm text-[#0C3B2E]">No Matching Product Mappings Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No items match your active search query or filter. Try clearing the search bar.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-slate-100">
                <thead className="bg-[#FAF8F5] text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4">Product ID &amp; Garment</th>
                    <th className="py-3.5 px-4">SKU Code</th>
                    <th className="py-3.5 px-4">Specs &amp; Category</th>
                    <th className="py-3.5 px-4">Price &amp; Stock</th>
                    <th className="py-3.5 px-4">Respective Seller / Vendor</th>
                    <th className="py-3.5 px-4 text-right">Fulfillment Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {filteredRows.map((row) => (
                    <tr key={row.rowId} className="hover:bg-slate-50/80 transition-colors">
                      {/* Product ID & Thumbnail */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative h-11 w-9 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                            {row.imageUrl ? (
                              <Image
                                src={row.imageUrl}
                                alt={row.productName}
                                fill
                                sizes="40px"
                                className="object-cover"
                              />
                            ) : (
                              <span className="h-full w-full flex items-center justify-center text-xs">👗</span>
                            )}
                          </div>
                          <div className="space-y-0.5 max-w-[200px]">
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 inline-block">
                              {row.productMasterId}
                            </span>
                            <Link
                              href={`/admin/products/${row.productId}`}
                              className="block font-bold text-slate-900 hover:text-[#C59B27] truncate"
                              title={row.productName}
                            >
                              {row.productName}
                            </Link>
                            <span className="text-[10px] text-slate-400 block">{row.brand}</span>
                          </div>
                        </div>
                      </td>

                      {/* SKU Code */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <span className="font-mono text-[11px] font-bold text-[#0C3B2E] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 block max-w-fit">
                            {row.sku}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium block">
                            {row.colour} • {row.size}
                          </span>
                        </div>
                      </td>

                      {/* Category & Specs */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5 max-w-[180px]">
                          <span className="text-[11px] font-medium text-slate-700 block truncate">
                            {row.categoryPath}
                          </span>
                        </div>
                      </td>

                      {/* Price & Stock */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-900">{formatINR(row.price)}</span>
                          <span
                            className={`text-[10px] font-bold block ${
                              row.stockQuantity > 5
                                ? "text-emerald-700"
                                : row.stockQuantity > 0
                                ? "text-amber-700"
                                : "text-rose-600"
                            }`}
                          >
                            {row.stockQuantity > 0 ? `${row.stockQuantity} in stock` : "Out of stock"}
                          </span>
                        </div>
                      </td>

                      {/* Seller Details */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900">{row.sellerName}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-[10px] font-bold text-slate-600 px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200">
                              {row.sellerId}
                            </span>
                            {row.sellerPhone && (
                              <span className="font-mono text-[10px] text-slate-500">{row.sellerPhone}</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 1-Click Fulfillment Connections */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {row.sellerPhone && (
                            <a
                              href={`https://wa.me/91${row.sellerPhone.replace(/[^0-9]/g, "").slice(-10)}?text=${encodeURIComponent(
                                `Hello ${row.sellerName}, order inquiry from Fashion Cart for Product ID: ${row.productMasterId}, SKU: ${row.sku} (${row.productName}).`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] flex items-center gap-1 shadow-2xs transition-colors"
                              title="Message Supplier on WhatsApp"
                            >
                              <span>💬</span> WhatsApp
                            </a>
                          )}

                          {row.sellerPhone && (
                            <a
                              href={`tel:${row.sellerPhone}`}
                              className="p-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors text-xs"
                              title={`Call ${row.sellerPhone}`}
                            >
                              📞
                            </a>
                          )}

                          {row.sellerEmail && (
                            <a
                              href={`mailto:${row.sellerEmail}?subject=${encodeURIComponent(
                                `Order Fulfillment Inquiry: ${row.sku}`
                              )}`}
                              className="p-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors text-xs"
                              title={`Email ${row.sellerEmail}`}
                            >
                              ✉️
                            </a>
                          )}

                          {row.sellerUrl && (
                            <a
                              href={row.sellerUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[10px] flex items-center gap-1 transition-colors"
                              title="Open Source Product / Supplier URL"
                            >
                              <span>🔗</span> Source
                            </a>
                          )}

                          <Link
                            href={`/admin/products/${row.productId}`}
                            className="p-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors text-xs"
                            title="Edit Product & Supplier Mapping"
                          >
                            ✏️
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* REGISTERED SUPPLIERS CARDS */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sellers.map((seller) => (
            <div
              key={seller.id}
              className="p-5 rounded-2xl bg-white border border-[#E8E3D8] shadow-xs space-y-4 hover:border-[#C59B27] transition-colors flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-[#0C3B2E]">{seller.name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FAF8F5] border border-[#E8E3D8] text-slate-700">
                        {seller.sellerId}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        • {seller.productCount} products mapped
                      </span>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                      seller.isActive
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {seller.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 pt-1 border-t border-slate-100">
                  {seller.phone ? (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">Phone:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium">{seller.phone}</span>
                        <a
                          href={`https://wa.me/91${seller.phone.replace(/[^0-9]/g, "").slice(-10)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-0.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] flex items-center gap-1 shadow-2xs"
                        >
                          💬 WhatsApp
                        </a>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">No phone number recorded</p>
                  )}

                  {seller.email && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">Email:</span>
                      <a
                        href={`mailto:${seller.email}`}
                        className="text-blue-600 hover:underline font-mono text-[11px] truncate max-w-[160px]"
                      >
                        {seller.email}
                      </a>
                    </div>
                  )}

                  {seller.url && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">Catalogue / URL:</span>
                      <a
                        href={seller.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-amber-700 hover:underline font-bold text-[11px] flex items-center gap-1 truncate max-w-[160px]"
                      >
                        <span>🔗 Source Link</span> ↗
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => openEditSellerModal(seller)}
                  className="px-3 py-1 rounded-lg text-xs font-bold border border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
                >
                  ✏️ Edit Supplier
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Supplier Modal */}
      {isSellerModalOpen && (
        <div className="fixed inset-0 z-50 p-4 flex items-center justify-center animate-in fade-in duration-150">
          <div onClick={() => setIsSellerModalOpen(false)} className="fixed inset-0 bg-black/70 backdrop-blur-xs" />

          <div className="relative w-full max-w-lg rounded-3xl p-6 sm:p-8 bg-white border border-[#E8E3D8] shadow-2xl space-y-5 z-10 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏭</span>
                <h3 className="font-display text-base font-bold text-[#0C3B2E]">
                  {editingSeller ? `Edit Supplier: ${editingSeller.name}` : "Register New Supplier"}
                </h3>
              </div>
              <button
                onClick={() => setIsSellerModalOpen(false)}
                className="h-8 w-8 rounded-full border border-slate-200 text-slate-400 hover:text-slate-800 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSeller} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Supplier / Seller Name *
                  </label>
                  <input
                    required
                    placeholder="e.g. NavNidhiCreation"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:border-[#0C3B2E]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Seller ID / Vendor Code *
                  </label>
                  <input
                    required
                    placeholder="e.g. SLR-NAVNIDHI-101"
                    value={formSellerId}
                    onChange={(e) => setFormSellerId(e.target.value)}
                    className="w-full font-mono px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:border-[#0C3B2E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Phone / WhatsApp Number
                  </label>
                  <input
                    placeholder="e.g. +91 9876543210"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full font-mono px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="supplier@example.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Supplier Catalogue / Source URL
                </label>
                <input
                  placeholder="https://supplier.example.com/store"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  className="w-full font-mono px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Warehouse / Business Address
                </label>
                <input
                  placeholder="e.g. Surat Textile Market, Gujarat"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Internal Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Fast shipping, MOQ 10 pcs, reliable fabric quality."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                <label htmlFor="isActive" className="font-semibold text-slate-700 cursor-pointer">
                  Active Supplier
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSellerModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSeller}
                  className="px-5 py-2 rounded-xl font-bold uppercase tracking-wider bg-[#141416] text-white hover:bg-[#25262B] transition-all cursor-pointer disabled:opacity-50"
                >
                  {savingSeller ? "Saving…" : "Save Supplier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
