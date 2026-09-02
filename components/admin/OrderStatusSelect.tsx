"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/providers/ToastProvider";

const STATUSES = [
  "PENDING_PAYMENT",
  "PAYMENT_REVIEW",
  "CONFIRMED",
  "PROCESSING",
  "PACKED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUND_PENDING",
  "REFUNDED",
];

export default function OrderStatusSelect({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);
  const { success, error } = useToast();

  const isTerminated = currentStatus === "CANCELLED" || currentStatus === "REFUNDED";

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
        success("Status Updated! 🎉", `Order is now ${newStatus.replace(/_/g, " ")}.`);
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
      className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-wider outline-none cursor-pointer transition-all ${
        isTerminated
          ? "border-rose-300 bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
          : "border-[#E7DFD5] dark:border-neutral-700 bg-white dark:bg-neutral-900 text-[#141416] dark:text-white"
      }`}
    >
      {STATUSES.map((s) => {
        const isDisallowed =
          isTerminated &&
          ["CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "DELIVERED"].includes(s);
        return (
          <option key={s} value={s} disabled={isDisallowed}>
            {s.replace(/_/g, " ")} {isDisallowed ? "(Restocked)" : ""}
          </option>
        );
      })}
    </select>
  );
}
