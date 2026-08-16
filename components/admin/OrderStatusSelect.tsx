"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUSES = [
  "PENDING_PAYMENT", "PAYMENT_REVIEW", "CONFIRMED", "PROCESSING", "PACKED",
  "SHIPPED", "DELIVERED", "CANCELLED", "REFUND_PENDING", "REFUNDED",
];

export default function OrderStatusSelect({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);

  async function onChange(newStatus: string) {
    setStatus(newStatus);
    setSaving(true);
    await fetch(`/api/admin/orders/${orderId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setSaving(false);
    router.refresh();
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
