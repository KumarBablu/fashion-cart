"use client";

import { useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/providers/ToastProvider";
import DownloadCsvButton from "./DownloadCsvButton";

type Review = {
  id: string;
  rating: number;
  title: string | null;
  comment: string;
  isVerifiedBuyer: boolean;
  status: string;
  createdAt: string | Date;
  user: { name: string; email: string };
  product: { id: string; name: string; slug: string };
};

export default function ReviewsManager({ initialReviews }: { initialReviews: Review[] }) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const { success, error } = useToast();

  async function updateStatus(id: string, newStatus: string) {
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setReviews((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
        );
        success("Review Updated", `Review marked as ${newStatus}.`);
      }
    } catch {
      error("Error", "Could not update status.");
    }
  }

  async function deleteReview(id: string) {
    if (!confirm("Are you sure you want to delete this customer review?")) return;
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r.id !== id));
        success("Deleted", "Review deleted permanently.");
      }
    } catch {
      error("Error", "Could not delete review.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Customer Reviews Moderation</h1>
          <p className="text-xs text-dim mt-0.5">Review feedback submitted by buyers across your shop catalog.</p>
        </div>
        <DownloadCsvButton type="reviews" label="Export Reviews CSV" />
      </div>

      <div className="overflow-x-auto rounded-2xl border" style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}>
        <table className="w-full text-left text-xs">
          <thead className="border-b font-bold uppercase tracking-wider text-dim" style={{ backgroundColor: "var(--fc-bg-subtle)", borderColor: "var(--fc-border)" }}>
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Rating</th>
              <th className="px-4 py-3">Feedback & Comment</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: "var(--fc-border)" }}>
            {reviews.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-dim">
                  No customer reviews submitted yet.
                </td>
              </tr>
            ) : (
              reviews.map((r) => (
                <tr key={r.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3.5">
                    <Link href={`/products/${r.product.slug}`} target="_blank" className="font-semibold text-primary hover:underline block max-w-[140px] truncate">
                      {r.product.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="font-bold">{r.user.name}</p>
                    <p className="text-[11px] text-dim">{r.user.email}</p>
                    {r.isVerifiedBuyer && (
                      <span className="text-[9px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.2 rounded mt-0.5 inline-block">
                        Verified
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-amber-400 font-bold">{"★".repeat(r.rating)}</span>
                  </td>
                  <td className="px-4 py-3.5 max-w-xs">
                    {r.title && <p className="font-bold text-[11px] mb-0.5">{r.title}</p>}
                    <p className="text-muted line-clamp-2">{r.comment}</p>
                  </td>
                  <td className="px-4 py-3.5 text-dim">
                    {new Date(r.createdAt).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        r.status === "APPROVED"
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : r.status === "REJECTED"
                          ? "bg-rose-500/15 text-rose-500"
                          : "bg-amber-500/15 text-amber-500"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right space-x-2">
                    {r.status !== "APPROVED" && (
                      <button
                        onClick={() => updateStatus(r.id, "APPROVED")}
                        className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                      >
                        Approve
                      </button>
                    )}
                    {r.status !== "REJECTED" && (
                      <button
                        onClick={() => updateStatus(r.id, "REJECTED")}
                        className="text-xs text-amber-600 font-bold hover:underline"
                      >
                        Reject
                      </button>
                    )}
                    <button
                      onClick={() => deleteReview(r.id)}
                      className="text-xs text-rose-500 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
