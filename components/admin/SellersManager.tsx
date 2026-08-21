"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/providers/ToastProvider";

type SellerItem = {
  id: string;
  sellerId: string;
  name: string;
  phone: string | null;
  email: string | null;
  url: string | null;
  address: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  _count: {
    products: number;
  };
  products: {
    id: string;
    name: string;
    slug: string;
    brand: string | null;
    status: string;
  }[];
};

export default function SellersManager({ initialSellers }: { initialSellers: SellerItem[] }) {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [sellers, setSellers] = useState<SellerItem[]>(initialSellers);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSeller, setEditingSeller] = useState<SellerItem | null>(null);

  // Form State
  const [formSellerId, setFormSellerId] = useState("");
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // Filtered sellers
  const filtered = sellers.filter((s) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.sellerId.toLowerCase().includes(q) ||
      (s.phone && s.phone.includes(q)) ||
      (s.email && s.email.toLowerCase().includes(q))
    );
  });

  function openCreateModal() {
    setEditingSeller(null);
    setFormSellerId(`SLR-${Date.now().toString().slice(-4)}`);
    setFormName("");
    setFormPhone("");
    setFormEmail("");
    setFormUrl("");
    setFormAddress("");
    setFormNotes("");
    setFormIsActive(true);
    setIsModalOpen(true);
  }

  function openEditModal(seller: SellerItem) {
    setEditingSeller(seller);
    setFormSellerId(seller.sellerId);
    setFormName(seller.name);
    setFormPhone(seller.phone || "");
    setFormEmail(seller.email || "");
    setFormUrl(seller.url || "");
    setFormAddress(seller.address || "");
    setFormNotes(seller.notes || "");
    setFormIsActive(seller.isActive);
    setIsModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim() || !formSellerId.trim()) {
      toastError("Validation Error", "Seller Name and Seller ID are required.");
      return;
    }

    setSaving(true);
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
      setSaving(false);

      if (!res.ok) {
        toastError("Save Failed", data.error || "Could not save seller record.");
        return;
      }

      success(
        editingSeller ? "Seller Updated 🎉" : "Seller Created 🎉",
        `"${payload.name}" has been saved.`
      );

      setIsModalOpen(false);
      router.refresh();

      // Update local state
      if (editingSeller) {
        setSellers((prev) =>
          prev.map((s) =>
            s.id === editingSeller.id
              ? { ...s, ...payload, updatedAt: new Date().toISOString() }
              : s
          )
        );
      } else {
        setSellers((prev) => [
          {
            ...data.seller,
            _count: { products: 0 },
            products: [],
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
      }
    } catch {
      setSaving(false);
      toastError("Error", "Network error while saving seller.");
    }
  }

  async function handleDelete(seller: SellerItem) {
    if (!confirm(`Are you sure you want to delete supplier "${seller.name}" (${seller.sellerId})?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/sellers/${seller.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toastError("Delete Failed", data.error || "Could not delete seller.");
        return;
      }

      success("Seller Deleted", `"${seller.name}" was removed.`);
      setSellers((prev) => prev.filter((s) => s.id !== seller.id));
      router.refresh();
    } catch {
      toastError("Error", "Network error during delete.");
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-[#E8E3D8] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏭</span>
            <h1 className="font-display text-xl sm:text-2xl font-bold text-[#0C3B2E]">
              Sellers &amp; Suppliers Directory
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FAF8F5] border border-[#E8E3D8] text-[#0C3B2E]">
              {sellers.length} Registered
            </span>
          </div>
          <p className="text-xs text-[#5B7A6F] mt-1">
            Manage your suppliers, vendor codes, direct WhatsApp connections, and source catalogue links for order fulfillment.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#141416] hover:bg-[#25262B] text-white shadow-md transition-all cursor-pointer shrink-0"
        >
          <span>✨</span>
          <span>Add New Supplier</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-[#E8E3D8] shadow-xs">
        <span className="text-slate-400 pl-2">🔍</span>
        <input
          type="text"
          placeholder="Search suppliers by name, Seller ID (e.g. SLR-VNS-101), phone number, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full text-xs bg-transparent focus:outline-hidden text-[#0C3B2E]"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="text-xs text-slate-400 hover:text-slate-700 px-2 cursor-pointer"
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* Suppliers Grid / List */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-[#E8E3D8] space-y-3">
          <span className="text-4xl block">🏭</span>
          <h3 className="font-bold text-sm text-[#0C3B2E]">No Suppliers Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm
              ? `No suppliers match "${searchTerm}".`
              : "Upload products via CSV or add a supplier to start managing your vendor fulfillment directory."}
          </p>
          {!searchTerm && (
            <button
              onClick={openCreateModal}
              className="mt-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#141416] text-white cursor-pointer"
            >
              + Register First Supplier
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((seller) => (
            <div
              key={seller.id}
              className="p-5 rounded-2xl bg-white border border-[#E8E3D8] shadow-xs space-y-4 hover:border-[#C59B27] transition-colors flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-[#0C3B2E]">{seller.name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FAF8F5] border border-[#E8E3D8] text-slate-700">
                        {seller.sellerId}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        • {seller._count.products} products linked
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

                {/* Contact Links */}
                <div className="space-y-1.5 text-xs text-slate-600 pt-1 border-t border-slate-100">
                  {seller.phone ? (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">Phone:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium">{seller.phone}</span>
                        <a
                          href={`https://wa.me/91${seller.phone.replace(/[^0-9]/g, "").slice(-10)}?text=${encodeURIComponent(
                            `Hello ${seller.name}, contacting regarding order fulfillment from Fashion Cart.`
                          )}`}
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

                {/* Linked Products Preview */}
                {seller.products.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Top Products:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {seller.products.slice(0, 3).map((p) => (
                        <Link
                          key={p.id}
                          href={`/admin/products/${p.id}`}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 truncate max-w-[180px]"
                        >
                          {p.name}
                        </Link>
                      ))}
                      {seller.products.length > 3 && (
                        <span className="text-[10px] text-slate-400 self-center">
                          +{seller.products.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => openEditModal(seller)}
                  className="px-3 py-1 rounded-lg text-xs font-bold border border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
                >
                  ✏️ Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(seller)}
                  className="px-3 py-1 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 p-4 flex items-center justify-center animate-in fade-in duration-150">
          <div onClick={() => setIsModalOpen(false)} className="fixed inset-0 bg-black/70 backdrop-blur-xs" />

          <div className="relative w-full max-w-lg rounded-3xl p-6 sm:p-8 bg-white border border-[#E8E3D8] shadow-2xl space-y-5 z-10 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏭</span>
                <h3 className="font-display text-base font-bold text-[#0C3B2E]">
                  {editingSeller ? `Edit Supplier: ${editingSeller.name}` : "Register New Supplier"}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="h-8 w-8 rounded-full border border-slate-200 text-slate-400 hover:text-slate-800 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Supplier / Seller Name *
                  </label>
                  <input
                    required
                    placeholder="e.g. Varanasi Heritage Silks"
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
                    placeholder="e.g. SLR-VNS-101"
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
                  placeholder="e.g. Ring Road Textile Market, Surat, Gujarat"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Internal Notes (Lead time, MOQ, payment terms)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Delivers in 2 days. 30 days credit."
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
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl font-bold uppercase tracking-wider bg-[#141416] text-white hover:bg-[#25262B] transition-all cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save Supplier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
