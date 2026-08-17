"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/providers/ToastProvider";

const STATUSES = [
  "PENDING_PAYMENT", "PAYMENT_REVIEW", "CONFIRMED", "PROCESSING", "PACKED",
  "SHIPPED", "DELIVERED", "CANCELLED", "REFUND_PENDING", "REFUNDED",
];

export default function OrderStatusSelect({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);
  const { success, error } = useToast();

  async function onChange(newStatus: string) {
    const prevStatus = status;
    setStatus(newStatus);
    setSaving(true);

    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setStatus(prevStatus);
        error("Status Update Failed", data?.error || "Could not update order status.");
      } else {
        success("Status Updated! 🎉", `Order is now ${newStatus.replace(/_/g, " ")}. Customer notified via email.`);
        router.refresh();
      }
    } catch {
      setStatus(prevStatus);
      error("Network Error", "Failed to reach server.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <select
      value={status}
      disabled={saving}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium disabled:opacity-50"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
      ))}
    </select>
  );
}
