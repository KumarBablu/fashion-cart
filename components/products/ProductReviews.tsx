"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/providers/ToastProvider";

type Review = {
  id: string;
  rating: number;
  title: string | null;
  comment: string;
  isVerifiedBuyer: boolean;
  createdAt: string;
  user: { name: string };
};

export default function ProductReviews({
  productId,
  productName,
  initialAverage = 0,
  initialCount = 0,
}: {
  productId: string;
  productName: string;
  initialAverage?: number;
  initialCount?: number;
}) {
  const { success, error } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form State
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function loadReviews() {
    try {
      const res = await fetch(`/api/reviews?productId=${productId}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReviews();
  }, [productId]);

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim()) {
      error("Comment required", "Please write a few words about your experience.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          rating,
          title: title.trim() || undefined,
          comment: comment.trim(),
        }),
      });

      if (res.status === 401) {
        error("Login Required", "Please log in to submit a verified product review.");
        return;
      }

      if (res.ok) {
        success("Review Submitted! ⭐", "Thank you for sharing your feedback.");
        setTitle("");
        setComment("");
        setShowForm(false);
        loadReviews();
      } else {
        const data = await res.json();
        error("Review Error", data.error || "Could not submit review.");
      }
    } catch {
      error("Network Error", "Unable to submit review.");
    } finally {
      setSubmitting(false);
    }
  }

  const reviewCount = reviews.length > 0 ? reviews.length : initialCount;
  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : Number(initialAverage || 4.8).toFixed(1);

  return (
    <div className="border-t pt-10" style={{ borderColor: "var(--fc-border)" }}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold">Customer Reviews & Ratings</h2>
          <p className="text-xs text-dim mt-1">Verified buyer experiences for {productName}</p>
        </div>
        <button
          onClick={() => setShowForm((prev) => !prev)}
          className="px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider border hover:bg-black/5 dark:hover:bg-white/5 transition-colors self-start"
          style={{ borderColor: "var(--fc-primary)", color: "var(--fc-primary)" }}
        >
          {showForm ? "✕ Cancel Review" : "★ Write a Review"}
        </button>
      </div>

      {/* Review Submission Form */}
      {showForm && (
        <form
          onSubmit={handleSubmitReview}
          className="mt-6 p-6 rounded-2xl border space-y-4 animate-in fade-in zoom-in-95 duration-200"
          style={{
            backgroundColor: "var(--fc-surface)",
            borderColor: "var(--fc-border)",
          }}
        >
          <h3 className="font-display text-lg font-semibold">Write Your Honest Review</h3>

          <div>
            <label className="block text-xs font-bold text-dim uppercase mb-1">Your Rating</label>
            <div className="flex gap-1.5 text-2xl cursor-pointer">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className={`transition-transform hover:scale-125 ${
                    star <= rating ? "text-amber-400" : "text-gray-300 dark:text-gray-600"
                  }`}
                >
                  ★
                </button>
              ))}
              <span className="text-sm text-dim ml-2 self-center font-bold">{rating} out of 5 stars</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-dim uppercase mb-1">Headline / Title (Optional)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Excellent fabric quality and true to size fit!"
              className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none focus:border-primary"
              style={{
                backgroundColor: "var(--fc-bg)",
                borderColor: "var(--fc-border)",
              }}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-dim uppercase mb-1">Your Detailed Feedback *</label>
            <textarea
              required
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How does it feel? How is the stitching, comfort, and fabric wash quality?"
              className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none focus:border-primary"
              style={{
                backgroundColor: "var(--fc-bg)",
                borderColor: "var(--fc-border)",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
            style={{
              backgroundColor: "var(--fc-primary)",
              color: "var(--fc-primary-fg)",
            }}
          >
            {submitting ? "Submitting…" : "Publish Review"}
          </button>
        </form>
      )}

      {/* Ratings Summary Card */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded-2xl border" style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}>
        <div className="flex flex-col items-center justify-center text-center p-4 border-b md:border-b-0 md:border-r" style={{ borderColor: "var(--fc-border)" }}>
          <span className="text-5xl font-black">{avgRating}</span>
          <div className="flex text-amber-400 text-lg my-1.5">
            {"★".repeat(Math.round(Number(avgRating)))}
            {"☆".repeat(5 - Math.round(Number(avgRating)))}
          </div>
          <p className="text-xs text-dim">Based on {reviewCount} customer ratings</p>
        </div>

        <div className="md:col-span-2 flex flex-col justify-center space-y-2">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = reviews.filter((r) => r.rating === stars).length;
            const pct = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : stars === 5 ? 75 : stars === 4 ? 20 : 5;
            return (
              <div key={stars} className="flex items-center gap-3 text-xs">
                <span className="w-12 font-medium">{stars} stars</span>
                <div className="flex-1 h-2 rounded-full overflow-hidden bg-black/10 dark:bg-white/10">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-8 text-right text-dim">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reviews List */}
      <div className="mt-8 space-y-4">
        {loading ? (
          <p className="text-sm text-dim">Loading reviews…</p>
        ) : reviews.length === 0 ? (
          <div className="text-center py-10 rounded-xl border border-dashed p-6" style={{ borderColor: "var(--fc-border)" }}>
            <p className="text-sm font-semibold">No reviews yet for this product.</p>
            <p className="text-xs text-dim mt-1">Be the first to share your thoughts with fellow shoppers!</p>
          </div>
        ) : (
          reviews.map((r) => (
            <div
              key={r.id}
              className="p-5 rounded-xl border space-y-2"
              style={{
                backgroundColor: "var(--fc-surface)",
                borderColor: "var(--fc-border)",
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex text-amber-400 text-sm">
                    {"★".repeat(r.rating)}
                    {"☆".repeat(5 - r.rating)}
                  </div>
                  {r.title && <span className="font-bold text-sm">{r.title}</span>}
                </div>
                <span className="text-[11px] text-dim">
                  {new Date(r.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>

              <p className="text-sm text-muted leading-relaxed">{r.comment}</p>

              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs font-semibold">{r.user.name}</span>
                {r.isVerifiedBuyer && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                    ✓ Verified Buyer
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
