"use client";

import { useState } from "react";
import Link from "next/link";
import { formatINR } from "@/lib/format";
import { useToast } from "@/components/providers/ToastProvider";

export type CustomerItem = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "CUSTOMER" | "ADMIN";
  registrationDate: string | Date;
  isActive: boolean;
  numberOfOrders: number;
  totalOrdersValue: number;
};

export default function CustomersManager({ initialCustomers }: { initialCustomers: CustomerItem[] }) {
  const [customers, setCustomers] = useState<CustomerItem[]>(initialCustomers);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "CUSTOMER" | "ADMIN">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "BLOCKED">("ALL");

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerItem | null>(null);
  const [reachCustomer, setReachCustomer] = useState<CustomerItem | null>(null);
  const [deleteCustomerId, setDeleteCustomerId] = useState<string | null>(null);

  // Create Form State
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "CUSTOMER" as "CUSTOMER" | "ADMIN",
    isActive: true,
  });

  // Edit Form State
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "CUSTOMER" as "CUSTOMER" | "ADMIN",
    isActive: true,
  });

  // Reach Form State
  const [reachSubject, setReachSubject] = useState("Order Assistance & Customer Inquiry");
  const [reachMessage, setReachMessage] = useState("");
  const [sendingReach, setSendingReach] = useState(false);

  const [loading, setLoading] = useState(false);
  const { success, error: toastError } = useToast();

  // Filtered customers
  const filtered = customers.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q));

    const matchesRole = roleFilter === "ALL" || c.role === roleFilter;
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && c.isActive) ||
      (statusFilter === "BLOCKED" && !c.isActive);

    return matchesQuery && matchesRole && matchesStatus;
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/admin/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        toastError("Error Creating Account", data.error || "Failed to create user.");
        return;
      }

      const created: CustomerItem = {
        id: data.customer.id,
        name: data.customer.name,
        email: data.customer.email,
        phone: data.customer.phone,
        role: data.customer.role,
        registrationDate: data.customer.createdAt,
        isActive: data.customer.isActive,
        numberOfOrders: 0,
        totalOrdersValue: 0,
      };

      setCustomers([created, ...customers]);
      setShowCreateModal(false);
      setCreateForm({ name: "", email: "", phone: "", password: "", role: "CUSTOMER", isActive: true });
      success("Customer Created", `Account for ${created.name} created successfully.`);
    } catch {
      setLoading(false);
      toastError("Network Error", "Unable to create customer.");
    }
  }

  function startEdit(c: CustomerItem) {
    setEditingCustomer(c);
    setEditForm({
      name: c.name,
      email: c.email,
      phone: c.phone || "",
      password: "",
      role: c.role,
      isActive: c.isActive,
    });
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingCustomer) return;
    setLoading(true);

    try {
      const payload: Record<string, unknown> = {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim() || null,
        role: editForm.role,
        isActive: editForm.isActive,
      };

      if (editForm.password.trim()) {
        payload.password = editForm.password.trim();
      }

      const res = await fetch(`/api/admin/customers/${editingCustomer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        toastError("Update Failed", data.error || "Failed to update profile.");
        return;
      }

      setCustomers(
        customers.map((c) =>
          c.id === editingCustomer.id
            ? {
                ...c,
                name: data.customer.name,
                email: data.customer.email,
                phone: data.customer.phone,
                role: data.customer.role,
                isActive: data.customer.isActive,
              }
            : c
        )
      );

      setEditingCustomer(null);
      success("Customer Updated", `Profile for ${data.customer.name} updated.`);
    } catch {
      setLoading(false);
      toastError("Network Error", "Unable to update customer.");
    }
  }

  async function toggleStatus(c: CustomerItem) {
    const nextStatus = !c.isActive;
    try {
      const res = await fetch(`/api/admin/customers/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextStatus }),
      });

      if (!res.ok) {
        toastError("Status Change Failed", "Could not toggle status.");
        return;
      }

      setCustomers(customers.map((x) => (x.id === c.id ? { ...x, isActive: nextStatus } : x)));
      success("Status Updated", `${c.name} is now ${nextStatus ? "Active" : "Blocked"}.`);
    } catch {
      toastError("Network Error", "Could not update status.");
    }
  }

  async function handleDelete(id: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/customers/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      setLoading(false);
      setDeleteCustomerId(null);

      if (!res.ok) {
        toastError("Delete Failed", data.error || "Could not delete customer.");
        return;
      }

      setCustomers(customers.filter((c) => c.id !== id));
      success("Account Deleted", data.message || "Customer account removed.");
    } catch {
      setLoading(false);
      toastError("Network Error", "Could not delete customer.");
    }
  }

  async function handleSendReach(e: React.FormEvent) {
    e.preventDefault();
    if (!reachCustomer || !reachMessage.trim()) return;
    setSendingReach(true);

    try {
      const res = await fetch(`/api/admin/customers/${reachCustomer.id}/reach`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: reachSubject.trim(),
          message: reachMessage.trim(),
          channel: "EMAIL",
        }),
      });

      const data = await res.json();
      setSendingReach(false);

      if (!res.ok) {
        toastError("Send Failed", data.error || "Could not send email.");
        return;
      }

      success("Email Dispatched! ✉️", data.message);
      setReachCustomer(null);
      setReachMessage("");
    } catch {
      setSendingReach(false);
      toastError("Network Error", "Could not send email message.");
    }
  }

  function exportCSV() {
    const headers = ["Name", "Email", "Phone", "Role", "Status", "Orders Count", "Total Spend (INR)", "Registered Date"];
    const rows = filtered.map((c) => [
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.email}"`,
      `"${c.phone || ""}"`,
      c.role,
      c.isActive ? "ACTIVE" : "BLOCKED",
      c.numberOfOrders,
      c.totalOrdersValue,
      `"${new Date(c.registrationDate).toLocaleDateString("en-IN")}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `FashionCart-Customers-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Global Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Customer &amp; User Control Center</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage customer accounts, search query profiles, edit details, reset passwords, and reach out directly.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportCSV}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
          >
            <span>📥</span> Export CSV
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 rounded-xl bg-[#0C3B2E] text-white hover:bg-[#144E3E] font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all"
          >
            <span>➕</span> Add New Customer
          </button>
        </div>
      </div>

      {/* Query, Filter & Search Toolbar */}
      <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex-1 min-w-[260px]">
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email address, or mobile number…"
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:border-[#0C3B2E] outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 outline-none"
          >
            <option value="ALL">All Roles</option>
            <option value="CUSTOMER">Customers Only</option>
            <option value="ADMIN">Admins Only</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Accounts</option>
            <option value="BLOCKED">Blocked Accounts</option>
          </select>

          {(searchQuery || roleFilter !== "ALL" || statusFilter !== "ALL") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setRoleFilter("ALL");
                setStatusFilter("ALL");
              }}
              className="text-xs text-rose-600 hover:underline px-2 py-1 font-semibold"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Customer Accounts Data Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Customer Profile</th>
                <th className="px-4 py-3.5">Contact Reach</th>
                <th className="px-4 py-3.5">Role</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Orders</th>
                <th className="px-4 py-3.5">Total Spent</th>
                <th className="px-4 py-3.5">Joined</th>
                <th className="px-5 py-3.5 text-right">Actions &amp; Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* Name & Avatar */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#0C3B2E]/10 text-[#0C3B2E] font-bold flex items-center justify-center text-xs">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <Link
                          href={`/admin/customers/${c.id}`}
                          className="font-bold text-slate-900 hover:text-[#0C3B2E] hover:underline flex items-center gap-1.5"
                        >
                          {c.name}
                        </Link>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">{c.id.slice(-8)}</p>
                      </div>
                    </div>
                  </td>

                  {/* Contact Reach */}
                  <td className="px-4 py-3.5 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <a href={`mailto:${c.email}`} className="text-slate-700 hover:text-[#0C3B2E] hover:underline">
                        ✉️ {c.email}
                      </a>
                    </div>
                    {c.phone ? (
                      <div className="flex items-center gap-2">
                        <a href={`tel:${c.phone}`} className="text-slate-500 hover:text-[#0C3B2E]">
                          📞 {c.phone}
                        </a>
                        <a
                          href={`https://wa.me/${c.phone.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                        >
                          WhatsApp
                        </a>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">No phone</span>
                    )}
                  </td>

                  {/* Role */}
                  <td className="px-4 py-3.5">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        c.role === "ADMIN"
                          ? "bg-amber-100 text-amber-900 border border-amber-300"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {c.role}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5">
                    <button
                      onClick={() => toggleStatus(c)}
                      title="Click to toggle status"
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${
                        c.isActive
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${c.isActive ? "bg-emerald-500" : "bg-rose-500"}`} />
                      {c.isActive ? "Active" : "Blocked"}
                    </button>
                  </td>

                  {/* Orders */}
                  <td className="px-4 py-3.5 font-bold text-slate-800">{c.numberOfOrders}</td>

                  {/* Total Spent */}
                  <td className="px-4 py-3.5 font-bold text-[#0C3B2E]">{formatINR(c.totalOrdersValue)}</td>

                  {/* Registration Date */}
                  <td className="px-4 py-3.5 text-slate-500">
                    {new Date(c.registrationDate).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>

                  {/* Action Buttons */}
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => {
                          setReachCustomer(c);
                          setReachSubject(`Fashion Cart Query Update for ${c.name}`);
                          setReachMessage("");
                        }}
                        title="Reach out via Email"
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-[#0C3B2E] hover:text-white text-slate-700 transition-all font-semibold flex items-center gap-1"
                      >
                        <span>💬</span> Reach
                      </button>
                      <button
                        onClick={() => startEdit(c)}
                        title="Edit Details / Password"
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition-all font-semibold"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => setDeleteCustomerId(c.id)}
                        title="Delete Account"
                        className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-all"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    No customers match your query or filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE CUSTOMER MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="font-display text-lg font-bold text-slate-900">Add New Customer / User</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="e.g. Priya Sharma"
                  className="w-full px-3 py-2 border rounded-xl outline-none focus:border-[#0C3B2E]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder="priya@example.com"
                  className="w-full px-3 py-2 border rounded-xl outline-none focus:border-[#0C3B2E]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                  Mobile Phone Number
                </label>
                <input
                  type="tel"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  placeholder="9876543210"
                  className="w-full px-3 py-2 border rounded-xl outline-none focus:border-[#0C3B2E]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                  Initial Password * (Min 6 chars)
                </label>
                <input
                  type="password"
                  required
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border rounded-xl outline-none focus:border-[#0C3B2E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">Role</label>
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-xl outline-none bg-white"
                  >
                    <option value="CUSTOMER">Customer</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">Status</label>
                  <select
                    value={createForm.isActive ? "ACTIVE" : "BLOCKED"}
                    onChange={(e) => setCreateForm({ ...createForm, isActive: e.target.value === "ACTIVE" })}
                    className="w-full px-3 py-2 border rounded-xl outline-none bg-white"
                  >
                    <option value="ACTIVE">Active Account</option>
                    <option value="BLOCKED">Blocked Account</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border rounded-xl hover:bg-slate-50 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-[#0C3B2E] text-white hover:bg-[#144E3E] font-bold"
                >
                  {loading ? "Creating…" : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CUSTOMER MODAL */}
      {editingCustomer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="font-display text-lg font-bold text-slate-900">Edit Customer &amp; Credentials</h2>
              <button onClick={() => setEditingCustomer(null)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl outline-none focus:border-[#0C3B2E]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl outline-none focus:border-[#0C3B2E]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                  Mobile Phone Number
                </label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="Leave empty if none"
                  className="w-full px-3 py-2 border rounded-xl outline-none focus:border-[#0C3B2E]"
                />
              </div>

              <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl space-y-1.5">
                <label className="block font-bold text-amber-900 uppercase tracking-wider text-[10px]">
                  🔑 Reset Customer Password (Optional)
                </label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  placeholder="Enter new password to change, or leave blank"
                  className="w-full px-3 py-1.5 border border-amber-300 rounded-lg outline-none bg-white text-xs"
                />
                <p className="text-[10px] text-amber-800">Only fill this if you want to change or reset their password.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">Role</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-xl outline-none bg-white"
                  >
                    <option value="CUSTOMER">Customer</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">Status</label>
                  <select
                    value={editForm.isActive ? "ACTIVE" : "BLOCKED"}
                    onChange={(e) => setEditForm({ ...editForm, isActive: e.target.value === "ACTIVE" })}
                    className="w-full px-3 py-2 border rounded-xl outline-none bg-white"
                  >
                    <option value="ACTIVE">Active Account</option>
                    <option value="BLOCKED">Blocked Account</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="px-4 py-2 border rounded-xl hover:bg-slate-50 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-[#0C3B2E] text-white hover:bg-[#144E3E] font-bold"
                >
                  {loading ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REACH OUT / DIRECT EMAIL MODAL */}
      {reachCustomer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900">Reach Out to Customer</h2>
                <p className="text-xs text-slate-500">
                  Sending to <strong>{reachCustomer.name}</strong> ({reachCustomer.email})
                </p>
              </div>
              <button onClick={() => setReachCustomer(null)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleSendReach} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                  Email Subject *
                </label>
                <input
                  type="text"
                  required
                  value={reachSubject}
                  onChange={(e) => setReachSubject(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl outline-none focus:border-[#0C3B2E]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                  Message Content *
                </label>
                <textarea
                  required
                  rows={5}
                  value={reachMessage}
                  onChange={(e) => setReachMessage(e.target.value)}
                  placeholder="Type your message, inquiry response, or special offer note here…"
                  className="w-full px-3 py-2 border rounded-xl outline-none focus:border-[#0C3B2E] resize-none"
                />
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border">
                <span>💡</span>
                <span>
                  This message will be dispatched directly to the customer&apos;s registered email address and logged in Email Logs.
                </span>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setReachCustomer(null)}
                  className="px-4 py-2 border rounded-xl hover:bg-slate-50 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingReach || !reachMessage.trim()}
                  className="px-5 py-2 rounded-xl bg-[#0C3B2E] text-white hover:bg-[#144E3E] font-bold flex items-center gap-1.5"
                >
                  {sendingReach ? "Sending…" : "✉️ Send Message to Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteCustomerId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4 text-center animate-in fade-in zoom-in-95">
            <div className="text-3xl">⚠️</div>
            <h3 className="font-display text-base font-bold text-slate-900">Confirm Customer Account Deletion</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Are you sure you want to permanently delete this customer profile and associated cart/wishlist data? This action cannot be undone.
            </p>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeleteCustomerId(null)}
                className="px-4 py-2 border rounded-xl font-bold text-xs hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteCustomerId)}
                disabled={loading}
                className="px-4 py-2 bg-rose-600 text-white rounded-xl font-bold text-xs hover:bg-rose-700"
              >
                {loading ? "Deleting…" : "Yes, Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
