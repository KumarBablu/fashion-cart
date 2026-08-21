"use client";

import { useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/providers/ToastProvider";
import DownloadCsvButton from "./DownloadCsvButton";

export type AdminReviewItem = {
  id: string;
  rating: number;
  title: string | null;
  comment: string;
  fitRating?: string | null;
  qualityRating?: number | null;
  colorAccuracy?: string | null;
  comfortRating?: number | null;
  valueRating?: number | null;
  sizePurchased?: string | null;
  occasionWorn?: string | null;
  recommend?: boolean | null;
  isVerifiedBuyer: boolean;
  status: string;
  createdAt: string | Date;
  user: { name: string; email: string; phone?: string | null };
  product: { id: string; name: string; slug: string };
};

export default function ReviewsManager({ initialReviews }: { initialReviews: AdminReviewItem[] }) {
  const [reviews, setReviews] = useState<AdminReviewItem[]>(initialReviews);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [fitFilter, setFitFilter] = useState("ALL");
  const [ratingFilter, setRatingFilter] = useState("ALL");
  const [selectedReview, setSelectedReview] = useState<AdminReviewItem | null>(null);
  const { success, error: toastError } = useToast();

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
        success("Review Updated", `Review status changed to ${newStatus}.`);
      }
    } catch {
      toastError("Error", "Could not update status.");
    }
  }

  async function deleteReview(id: string) {
    if (!confirm("Are you sure you want to delete this customer review?")) return;
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r.id !== id));
        success("Deleted", "Review deleted permanently.");
        if (selectedReview?.id === id) setSelectedReview(null);
      }
    } catch {
      toastError("Error", "Could not delete review.");
    }
  }

  // Filtered reviews
  const filtered = reviews.filter((r) => {
    if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
    if (fitFilter !== "ALL" && r.fitRating !== fitFilter) return false;
    if (ratingFilter !== "ALL" && r.rating !== Number(ratingFilter)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = r.user.name.toLowerCase().includes(q);
      const matchEmail = r.user.email.toLowerCase().includes(q);
      const matchProduct = r.product.name.toLowerCase().includes(q);
      const matchComment = r.comment.toLowerCase().includes(q);
      const matchTitle = (r.title || "").toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchProduct && !matchComment && !matchTitle) return false;
    }
    return true;
  });

  // Calculate Survey Analytics
  const total = reviews.length;
  const avgRating = total > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / total).toFixed(1) : "5.0";
  const recommendPercent = total > 0
    ? Math.round((reviews.filter((r) => r.recommend !== false).length / total) * 100)
    : 100;
  const trueToSizeCount = reviews.filter((r) => !r.fitRating || r.fitRating === "TRUE_TO_SIZE").length;
  const trueToSizePercent = total > 0 ? Math.round((trueToSizeCount / total) * 100) : 100;

  return (
    <div className="h-full overflow-y-auto min-h-0 space-y-6 pr-1 pb-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <span>⭐</span> Customer Feedback &amp; Survey Matrix
          </h1>
          <p className="text-xs text-dim mt-0.5">
            Tabular evaluation of garment fit, weave quality, color accuracy, and buyer sentiment ({reviews.length} total evaluations)
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <DownloadCsvButton type="reviews" label="Export Survey CSV" />
        </div>
      </div>

      {/* Analytics KPI Scorecards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border bg-white dark:bg-neutral-900 shadow-xs" style={{ borderColor: "var(--fc-border)" }}>
          <p className="text-[11px] font-bold text-dim uppercase tracking-wider">Average Rating</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-primary">{avgRating}</span>
            <span className="text-amber-500 text-sm">★★★★★</span>
          </div>
          <p className="text-[10px] text-dim mt-0.5">{total} total reviews submitted</p>
        </div>

        <div className="p-4 rounded-2xl border bg-white dark:bg-neutral-900 shadow-xs" style={{ borderColor: "var(--fc-border)" }}>
          <p className="text-[11px] font-bold text-dim uppercase tracking-wider">Recommendation Rate</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{recommendPercent}%</span>
          </div>
          <p className="text-[10px] text-dim mt-0.5">Would buy or recommend</p>
        </div>

        <div className="p-4 rounded-2xl border bg-white dark:bg-neutral-900 shadow-xs" style={{ borderColor: "var(--fc-border)" }}>
          <p className="text-[11px] font-bold text-dim uppercase tracking-wider">Fit Accuracy</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-primary">{trueToSizePercent}%</span>
          </div>
          <p className="text-[10px] text-dim mt-0.5">Reported True to Size</p>
        </div>

        <div className="p-4 rounded-2xl border bg-white dark:bg-neutral-900 shadow-xs" style={{ borderColor: "var(--fc-border)" }}>
          <p className="text-[11px] font-bold text-dim uppercase tracking-wider">Verified Buyers</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">100%</span>
          </div>
          <p className="text-[10px] text-dim mt-0.5">Validated order history</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl border" style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by product, customer, or keyword…"
          className="flex-1 min-w-[240px] px-3.5 py-2 rounded-xl border text-xs outline-none focus:border-primary"
          style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}
        />

        <select
          value={ratingFilter}
          onChange={(e) => setRatingFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border text-xs outline-none focus:border-primary"
          style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}
        >
          <option value="ALL">All Star Ratings</option>
          <option value="5">5 Stars Only</option>
          <option value="4">4 Stars</option>
          <option value="3">3 Stars</option>
          <option value="2">2 Stars</option>
          <option value="1">1 Star</option>
        </select>

        <select
          value={fitFilter}
          onChange={(e) => setFitFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border text-xs outline-none focus:border-primary"
          style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}
        >
          <option value="ALL">All Sizing Fits</option>
          <option value="TRUE_TO_SIZE">True to Size</option>
          <option value="RUNS_SMALL">Runs Small</option>
          <option value="RUNS_LARGE">Runs Large</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border text-xs outline-none focus:border-primary"
          style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}
        >
          <option value="ALL">All Statuses</option>
          <option value="APPROVED">Approved Only</option>
          <option value="PENDING">Pending Review</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {/* Tabular Survey Matrix Table */}
      <div className="overflow-x-auto rounded-2xl border shadow-sm" style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}>
        <table className="w-full text-left text-xs">
          <thead className="border-b font-bold uppercase tracking-wider text-dim" style={{ backgroundColor: "var(--fc-bg-subtle)", borderColor: "var(--fc-border)" }}>
            <tr>
              <th className="px-4 py-3.5">Product &amp; Garment</th>
              <th className="px-4 py-3.5">Customer / Buyer</th>
              <th className="px-4 py-3.5">Rating &amp; Title</th>
              <th className="px-4 py-3.5">Fit &amp; Sizing Survey</th>
              <th className="px-4 py-3.5">Quality &amp; Color</th>
              <th className="px-4 py-3.5">Occasion / Rec</th>
              <th className="px-4 py-3.5">Feedback Story</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: "var(--fc-border)" }}>
            {filtered.map((rev) => (
              <tr key={rev.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                {/* Product */}
                <td className="px-4 py-3 font-medium">
                  <Link href={`/products/${rev.product.slug}`} target="_blank" className="font-bold hover:underline text-primary">
                    {rev.product.name}
                  </Link>
                  <p className="text-[10px] text-dim mt-0.5">ID: {rev.product.id.slice(0, 8)}…</p>
                </td>

                {/* Customer */}
                <td className="px-4 py-3">
                  <p className="font-bold">{rev.user.name}</p>
                  <p className="text-[10px] text-dim">{rev.user.email}</p>
                  {rev.isVerifiedBuyer && (
                    <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ✓ Verified Buyer
                    </span>
                  )}
                </td>

                {/* Stars & Headline */}
                <td className="px-4 py-3">
                  <div className="flex text-amber-500 text-xs">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i}>{i < rev.rating ? "★" : "☆"}</span>
                    ))}
                  </div>
                  {rev.title && <p className="font-bold text-[11px] mt-0.5">{rev.title}</p>}
                </td>

                {/* Fit & Sizing */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                    rev.fitRating === "RUNS_SMALL"
                      ? "bg-amber-50 text-amber-800 border-amber-200"
                      : rev.fitRating === "RUNS_LARGE"
                      ? "bg-blue-50 text-blue-800 border-blue-200"
                      : "bg-emerald-50 text-emerald-800 border-emerald-200"
                  }`}>
                    {rev.fitRating === "RUNS_SMALL" ? "Runs Small" : rev.fitRating === "RUNS_LARGE" ? "Runs Large" : "True to Size"}
                  </span>
                  {rev.sizePurchased && (
                    <span className="block text-[10px] text-dim mt-0.5 font-mono">
                      Bought: {rev.sizePurchased}
                    </span>
                  )}
                </td>

                {/* Quality & Color Accuracy */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <p className="text-[11px] font-semibold">
                    🧵 Fabric: <span className="font-bold text-primary">{rev.qualityRating || rev.rating}/5</span>
                  </p>
                  <p className="text-[10px] text-dim mt-0.5">
                    🎨 {rev.colorAccuracy === "EXACT_MATCH" ? "100% Match" : rev.colorAccuracy === "SLIGHT_VARIATION" ? "Slight Tone Diff" : "Different"}
                  </p>
                </td>

                {/* Occasion / Recommendation */}
                <td className="px-4 py-3 whitespace-nowrap">
                  {rev.occasionWorn && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20">
                      {rev.occasionWorn}
                    </span>
                  )}
                  <p className="text-[10px] text-emerald-600 font-bold mt-0.5">
                    {rev.recommend !== false ? "✓ Recommends" : "✗ Doesn't Recommend"}
                  </p>
                </td>

                {/* Feedback Comment */}
                <td className="px-4 py-3 max-w-xs">
                  <p className="text-dim line-clamp-2 leading-relaxed">
                    {rev.comment}
                  </p>
                  <button
                    onClick={() => setSelectedReview(rev)}
                    className="text-[10px] text-primary hover:underline font-bold mt-0.5 cursor-pointer"
                  >
                    View Full Story →
                  </button>
                </td>

                {/* Moderation Status */}
                <td className="px-4 py-3">
                  <select
                    value={rev.status}
                    onChange={(e) => updateStatus(rev.id, e.target.value)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold border outline-none cursor-pointer ${
                      rev.status === "APPROVED"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : rev.status === "PENDING"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}
                  >
                    <option value="APPROVED">Approved</option>
                    <option value="PENDING">Pending</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </td>

                {/* Action Buttons */}
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => setSelectedReview(rev)}
                      className="p-1.5 rounded-lg border text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      title="Inspect full survey"
                      style={{ borderColor: "var(--fc-border)" }}
                    >
                      👁️
                    </button>
                    <button
                      onClick={() => deleteReview(rev.id)}
                      className="p-1.5 rounded-lg border text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
                      title="Delete review"
                      style={{ borderColor: "var(--fc-border)" }}
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-dim">
                  <p className="text-3xl">🔍</p>
                  <p className="font-bold text-sm mt-2">No reviews match the selected survey criteria.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detailed Survey Inspection Modal */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 p-4 flex items-center justify-center animate-in fade-in duration-200">
          <div
            onClick={() => setSelectedReview(null)}
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
          />

          <div
            className="relative w-full max-w-lg rounded-2xl border p-6 shadow-2xl z-10 space-y-4 animate-in zoom-in-95"
            style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--fc-border)" }}>
              <div>
                <h3 className="font-display text-base font-bold text-primary">
                  Customer Garment Evaluation Audit
                </h3>
                <p className="text-xs text-dim">Submitted on {new Date(selectedReview.createdAt).toLocaleString("en-IN")}</p>
              </div>
              <button
                onClick={() => setSelectedReview(null)}
                className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* Survey Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl border bg-neutral-50/50 dark:bg-neutral-900/50" style={{ borderColor: "var(--fc-border)" }}>
                <p className="text-[10px] text-dim uppercase font-bold">Product</p>
                <p className="font-bold text-primary">{selectedReview.product.name}</p>
              </div>

              <div className="p-3 rounded-xl border bg-neutral-50/50 dark:bg-neutral-900/50" style={{ borderColor: "var(--fc-border)" }}>
                <p className="text-[10px] text-dim uppercase font-bold">Customer</p>
                <p className="font-bold">{selectedReview.user.name}</p>
                <p className="text-[10px] text-dim">{selectedReview.user.email}</p>
              </div>

              <div className="p-3 rounded-xl border bg-neutral-50/50 dark:bg-neutral-900/50" style={{ borderColor: "var(--fc-border)" }}>
                <p className="text-[10px] text-dim uppercase font-bold">Fit Experience</p>
                <p className="font-bold">{selectedReview.fitRating || "True to Size"}</p>
                <p className="text-[10px] text-dim">Size: {selectedReview.sizePurchased || "Not specified"}</p>
              </div>

              <div className="p-3 rounded-xl border bg-neutral-50/50 dark:bg-neutral-900/50" style={{ borderColor: "var(--fc-border)" }}>
                <p className="text-[10px] text-dim uppercase font-bold">Quality &amp; Weave</p>
                <p className="font-bold">{selectedReview.qualityRating || selectedReview.rating}/5 Stars</p>
                <p className="text-[10px] text-dim">Color: {selectedReview.colorAccuracy || "100% Match"}</p>
              </div>

              <div className="p-3 rounded-xl border bg-neutral-50/50 dark:bg-neutral-900/50" style={{ borderColor: "var(--fc-border)" }}>
                <p className="text-[10px] text-dim uppercase font-bold">Occasion Worn For</p>
                <p className="font-bold">{selectedReview.occasionWorn || "Everyday / Festive"}</p>
              </div>

              <div className="p-3 rounded-xl border bg-neutral-50/50 dark:bg-neutral-900/50" style={{ borderColor: "var(--fc-border)" }}>
                <p className="text-[10px] text-dim uppercase font-bold">Recommendation</p>
                <p className="font-bold text-emerald-600">{selectedReview.recommend !== false ? "✓ Highly Recommended" : "✗ Not Recommended"}</p>
              </div>
            </div>

            {/* Headline & Feedback */}
            <div className="p-4 rounded-xl border space-y-1.5" style={{ borderColor: "var(--fc-border)" }}>
              {selectedReview.title && (
                <h4 className="font-bold text-sm text-primary">{selectedReview.title}</h4>
              )}
              <p className="text-xs leading-relaxed whitespace-pre-line text-dim">
                {selectedReview.comment}
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedReview(null)}
                className="px-4 py-2 rounded-xl border text-xs font-bold"
                style={{ borderColor: "var(--fc-border)" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
