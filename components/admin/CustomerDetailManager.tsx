"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatINR } from "@/lib/format";
import { useToast } from "@/components/providers/ToastProvider";

type CustomerDetailProps = {
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: "CUSTOMER" | "ADMIN";
    createdAt: string | Date;
    isActive: boolean;
    addresses: {
      id: string;
      fullName: string;
      mobileNumber: string;
      addressLine1: string;
      addressLine2?: string | null;
      city: string;
      state: string;
      pinCode: string;
      isDefault: boolean;
    }[];
    orders: {
      id: string;
      orderNumber: string;
      status: string;
      total: any;
      createdAt: string | Date;
      payment?: {
        method: string;
        status: string;
      } | null;
      items: any[];
    }[];
    reviews?: {
      id: string;
      rating: number;
      comment?: string | null;
      createdAt: string | Date;
      product: { name: string; slug: string };
    }[];
  };
};

export default function CustomerDetailManager({ customer: initialCustomer }: CustomerDetailProps) {
  const router = useRouter();
  const [customer, setCustomer] = useState(initialCustomer);
  const [activeTab, setActiveTab] = useState<"overview" | "reach" | "edit" | "orders">("overview");

  // Edit Form State
  const [editForm, setEditForm] = useState({
    name: customer.name,
    email: customer.email,
    phone: customer.phone || "",
    password: "",
    role: customer.role,
    isActive: customer.isActive,
  });

  // Reach Form State
  const [reachSubject, setReachSubject] = useState(`Fashion Cart Assistance — ${customer.name}`);
  const [reachMessage, setReachMessage] = useState("");
  const [sendingReach, setSendingReach] = useState(false);

  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { success, error: toastError } = useToast();

  const totalSpent = customer.orders.reduce((sum, o) => sum + Number(o.total), 0);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
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

      const res = await fetch(`/api/admin/customers/${customer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        toastError("Update Failed", data.error || "Could not update profile.");
        return;
      }

      setCustomer({ ...customer, ...data.customer });
      success("Profile Updated", `Customer details saved.`);
      setActiveTab("overview");
    } catch {
      setLoading(false);
      toastError("Network Error", "Unable to update profile.");
    }
  }

  async function toggleStatus() {
    const nextStatus = !customer.isActive;
    try {
      const res = await fetch(`/api/admin/customers/${customer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextStatus }),
      });

      if (!res.ok) {
        toastError("Status Change Failed", "Could not toggle status.");
        return;
      }

      setCustomer({ ...customer, isActive: nextStatus });
      setEditForm({ ...editForm, isActive: nextStatus });
      success("Status Updated", `Customer is now ${nextStatus ? "Active" : "Blocked"}.`);
    } catch {
      toastError("Network Error", "Could not update status.");
    }
  }

  async function handleDelete() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/customers/${customer.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        toastError("Delete Failed", data.error || "Could not delete customer.");
        return;
      }

      success("Account Deleted", data.message || "Customer deleted.");
      router.push("/admin/customers");
      router.refresh();
    } catch {
      setLoading(false);
      toastError("Network Error", "Could not delete customer.");
    }
  }

  async function handleSendReach(e: React.FormEvent) {
    e.preventDefault();
    if (!reachMessage.trim()) return;
    setSendingReach(true);

    try {
      const res = await fetch(`/api/admin/customers/${customer.id}/reach`, {
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
        toastError("Dispatch Failed", data.error || "Could not send message.");
        return;
      }

      success("Email Dispatched! ✉️", data.message);
      setReachMessage("");
    } catch {
      setSendingReach(false);
      toastError("Network Error", "Could not dispatch email.");
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/admin/customers" className="text-xs text-slate-500 hover:text-[#0C3B2E] font-bold">
            ← Back to All Customers
          </Link>
          <div className="flex items-center gap-3 mt-1.5">
            <h1 className="font-display text-2xl font-bold text-slate-900">{customer.name}</h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                customer.role === "ADMIN"
                  ? "bg-amber-100 text-amber-900 border border-amber-300"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {customer.role}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                customer.isActive
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-rose-50 text-rose-700 border border-rose-200"
              }`}
            >
              {customer.isActive ? "Active" : "Blocked"}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {customer.email} · {customer.phone ?? "No phone recorded"} · <span className="font-mono font-bold text-slate-700">USR-{customer.id.slice(-6).toUpperCase()}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {customer.phone && (
            <a
              href={`https://wa.me/${customer.phone.replace(/[^0-9]/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              <span>💬</span> WhatsApp
            </a>
          )}
          <button
            onClick={() => setActiveTab("reach")}
            className="px-3.5 py-2 rounded-xl bg-[#0C3B2E] text-white hover:bg-[#144E3E] font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
          >
            <span>✉️</span> Send Email
          </button>
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Lifetime Spend</p>
          <p className="text-xl font-black text-[#0C3B2E] mt-1">{formatINR(totalSpent)}</p>
        </div>
        <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Orders</p>
          <p className="text-xl font-black text-slate-900 mt-1">{customer.orders.length}</p>
        </div>
        <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Customer Since</p>
          <p className="text-sm font-bold text-slate-900 mt-1.5">
            {new Date(customer.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab("overview")}
          className={`pb-3 border-b-2 transition-all ${
            activeTab === "overview"
              ? "border-[#0C3B2E] text-[#0C3B2E]"
              : "border-transparent text-slate-400 hover:text-slate-700"
          }`}
        >
          Customer Overview &amp; Addresses
        </button>
        <button
          onClick={() => setActiveTab("reach")}
          className={`pb-3 border-b-2 transition-all ${
            activeTab === "reach"
              ? "border-[#0C3B2E] text-[#0C3B2E]"
              : "border-transparent text-slate-400 hover:text-slate-700"
          }`}
        >
          ✉️ Reach Customer Desk
        </button>
        <button
          onClick={() => setActiveTab("edit")}
          className={`pb-3 border-b-2 transition-all ${
            activeTab === "edit"
              ? "border-[#0C3B2E] text-[#0C3B2E]"
              : "border-transparent text-slate-400 hover:text-slate-700"
          }`}
        >
          ✏️ Edit Profile &amp; Password
        </button>
        <button
          onClick={() => setActiveTab("orders")}
          className={`pb-3 border-b-2 transition-all ${
            activeTab === "orders"
              ? "border-[#0C3B2E] text-[#0C3B2E]"
              : "border-transparent text-slate-400 hover:text-slate-700"
          }`}
        >
          Orders ({customer.orders.length})
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Saved Addresses */}
          <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
            <h2 className="font-display text-base font-bold text-slate-900">Saved Delivery Addresses</h2>
            {customer.addresses.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No saved addresses on file.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {customer.addresses.map((a) => (
                  <div key={a.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <strong className="text-slate-900">{a.fullName}</strong>
                      {a.isDefault && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#0C3B2E]/10 text-[#0C3B2E]">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600">📞 {a.mobileNumber}</p>
                    <p className="text-slate-600">
                      {a.addressLine1}
                      {a.addressLine2 ? `, ${a.addressLine2}` : ""}
                    </p>
                    <p className="text-slate-600 font-semibold">
                      {a.city}, {a.state} - {a.pinCode}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Orders Preview */}
          <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-display text-base font-bold text-slate-900">Recent Orders</h2>
              <button onClick={() => setActiveTab("orders")} className="text-xs text-[#0C3B2E] font-bold hover:underline">
                View All Orders →
              </button>
            </div>
            {customer.orders.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No orders placed yet.</p>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {customer.orders.slice(0, 5).map((o) => (
                  <div key={o.id} className="py-3 flex items-center justify-between">
                    <div>
                      <Link href={`/admin/orders/${o.id}`} className="font-bold text-[#0C3B2E] hover:underline">
                        #{o.orderNumber}
                      </Link>
                      <p className="text-slate-400 text-[11px] mt-0.5">
                        {new Date(o.createdAt).toLocaleDateString("en-IN")} · {o.payment?.method || "UPI"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-900">{formatINR(o.total)}</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {o.status.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: REACH CUSTOMER DESK */}
      {activeTab === "reach" && (
        <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-5">
          <div>
            <h2 className="font-display text-base font-bold text-slate-900">Customer Communication &amp; Inquiry Reach</h2>
            <p className="text-xs text-slate-500 mt-1">
              Send direct transactional notifications, answers to customer inquiries, or special boutique discount vouchers.
            </p>
          </div>

          {/* 1-Click WhatsApp Quick Actions */}
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-2.5">
            <p className="font-bold text-emerald-900 text-xs flex items-center gap-1.5">
              <span>📲</span> 1-Click Zero-Cost WhatsApp Quick Notifications:
            </p>
            <div className="flex flex-wrap gap-2">
              {customer.phone && (
                <>
                  <a
                    href={`https://wa.me/91${customer.phone.replace(/[^0-9]/g, "").slice(-10)}?text=${encodeURIComponent(
                      `Namaste ${customer.name}! 👗 Welcome to Fashion Cart Luxury Atelier. Use code *FIRST10* for 10% OFF + Free Delivery: https://fashion-cart-5p7k.vercel.app/shop`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1"
                  >
                    <span>🎁</span> WhatsApp Welcome &amp; Offer
                  </a>

                  <a
                    href={`https://wa.me/91${customer.phone.replace(/[^0-9]/g, "").slice(-10)}?text=${encodeURIComponent(
                      `Namaste ${customer.name}! 🛍️ Quick update from Fashion Cart regarding your orders: https://fashion-cart-5p7k.vercel.app/account`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1"
                  >
                    <span>📦</span> WhatsApp Account Update
                  </a>

                  <a
                    href={`https://wa.me/91${customer.phone.replace(/[^0-9]/g, "").slice(-10)}?text=${encodeURIComponent(
                      `Hello ${customer.name}! How can we assist you today at Fashion Cart?`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 font-bold text-xs flex items-center gap-1"
                  >
                    <span>💬</span> Open WhatsApp Chat
                  </a>
                </>
              )}
            </div>
          </div>

          <form onSubmit={handleSendReach} className="space-y-4 text-xs">
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
                Email Message Content *
              </label>
              <textarea
                required
                rows={6}
                value={reachMessage}
                onChange={(e) => setReachMessage(e.target.value)}
                placeholder="Write your direct note, feedback, or update to the customer..."
                className="w-full px-3 py-2 border rounded-xl outline-none focus:border-[#0C3B2E] resize-none"
              />
            </div>

            <div className="p-3 bg-slate-50 border rounded-xl flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Dispatched to: <strong className="text-slate-800">{customer.email}</strong>
              </span>
              <button
                type="submit"
                disabled={sendingReach || !reachMessage.trim()}
                className="px-6 py-2.5 rounded-xl bg-[#0C3B2E] text-white hover:bg-[#144E3E] font-bold uppercase tracking-wider text-xs flex items-center gap-1.5 shadow-sm"
              >
                {sendingReach ? "Sending…" : "✉️ Send Email to Customer"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: EDIT PROFILE & CREDENTIALS */}
      {activeTab === "edit" && (
        <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b pb-4">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900">Update Profile &amp; Security</h2>
              <p className="text-xs text-slate-500">Manage account information, assign roles, or reset login password.</p>
            </div>
            <button
              onClick={toggleStatus}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                customer.isActive ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
              }`}
            >
              {customer.isActive ? "🔒 Block Account" : "✓ Activate Account"}
            </button>
          </div>

          <form onSubmit={handleUpdate} className="space-y-4 text-xs max-w-xl">
            <div>
              <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">Full Name</label>
              <input
                type="text"
                required
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl outline-none focus:border-[#0C3B2E]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">Email Address</label>
              <input
                type="email"
                required
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl outline-none focus:border-[#0C3B2E]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">Mobile Number</label>
              <input
                type="tel"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                placeholder="Leave blank if none"
                className="w-full px-3 py-2 border rounded-xl outline-none focus:border-[#0C3B2E]"
              />
            </div>

            <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-1.5">
              <label className="block font-bold text-amber-900 uppercase tracking-wider text-[10px]">
                🔑 Change / Reset Customer Password
              </label>
              <input
                type="password"
                value={editForm.password}
                onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                placeholder="Type new password, or leave blank to keep existing"
                className="w-full px-3 py-2 border border-amber-300 rounded-xl outline-none bg-white text-xs"
              />
              <p className="text-[10px] text-amber-800">Directly resets the customer&apos;s password in the database.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-xl outline-none bg-white font-medium"
                >
                  <option value="CUSTOMER">Customer</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">Account Status</label>
                <select
                  value={editForm.isActive ? "ACTIVE" : "BLOCKED"}
                  onChange={(e) => setEditForm({ ...editForm, isActive: e.target.value === "ACTIVE" })}
                  className="w-full px-3 py-2 border rounded-xl outline-none bg-white font-medium"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="BLOCKED">Blocked</option>
                </select>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between border-t">
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 border border-rose-300 text-rose-600 hover:bg-rose-50 rounded-xl font-bold"
              >
                🗑️ Delete Account
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-[#0C3B2E] text-white hover:bg-[#144E3E] font-bold uppercase tracking-wider"
              >
                {loading ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: ORDERS */}
      {activeTab === "orders" && (
        <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
          <h2 className="font-display text-base font-bold text-slate-900">Complete Order History</h2>
          {customer.orders.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No orders recorded for this customer.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b text-slate-500 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Order Number</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Payment</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customer.orders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-bold text-[#0C3B2E]">#{o.orderNumber}</td>
                      <td className="px-4 py-3 text-slate-500">{new Date(o.createdAt).toLocaleDateString("en-IN")}</td>
                      <td className="px-4 py-3">{o.payment?.method || "UPI"}</td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {o.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold">{formatINR(o.total)}</td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/orders/${o.id}`}
                          className="px-3 py-1 bg-[#0C3B2E] text-white rounded-lg font-bold text-[11px] hover:bg-[#144E3E]"
                        >
                          Manage Order →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4 text-center animate-in fade-in zoom-in-95">
            <div className="text-3xl">⚠️</div>
            <h3 className="font-display text-base font-bold text-slate-900">Delete Customer Account</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Are you sure you want to delete <strong>{customer.name}</strong> ({customer.email})? This action cannot be undone.
            </p>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border rounded-xl font-bold text-xs hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
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
