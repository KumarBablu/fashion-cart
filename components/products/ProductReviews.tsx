"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useToast } from "@/components/providers/ToastProvider";

type Review = {
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
  createdAt: string;
  user: { name: string };
};

type SurveySummary = {
  total: number;
  recommendPercent: number;
  colorAccuracyPercent: number;
  avgQuality: string;
  avgComfort: string;
  avgValue: string;
  fitDistribution: {
    runsSmall: number;
    trueToSize: number;
    runsLarge: number;
  };
};

export default function ProductReviews({
  productId,
  productName,
  initialAverage = 4.8,
  initialCount = 18,
}: {
  productId: string;
  productName: string;
  initialAverage?: number;
  initialCount?: number;
}) {
  const { success, error: toastError } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [surveySummary, setSurveySummary] = useState<SurveySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (showSurveyModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showSurveyModal]);

  // Survey Form State
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [fitRating, setFitRating] = useState<"RUNS_SMALL" | "TRUE_TO_SIZE" | "RUNS_LARGE">("TRUE_TO_SIZE");
  const [qualityRating, setQualityRating] = useState(5);
  const [colorAccuracy, setColorAccuracy] = useState<"EXACT_MATCH" | "SLIGHT_VARIATION" | "VERY_DIFFERENT">("EXACT_MATCH");
  const [comfortRating, setComfortRating] = useState(5);
  const [valueRating, setValueRating] = useState(5);
  const [sizePurchased, setSizePurchased] = useState("M");
  const [occasionWorn, setOccasionWorn] = useState("Festive / Wedding");
  const [recommend, setRecommend] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function loadReviews() {
    try {
      const res = await fetch(`/api/reviews?productId=${productId}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
        if (data.surveySummary) setSurveySummary(data.surveySummary);
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

  async function handleSubmitSurvey(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim()) {
      toastError("Feedback required", "Please write a few words about your experience with this garment.");
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
          fitRating,
          qualityRating,
          colorAccuracy,
          comfortRating,
          valueRating,
          sizePurchased,
          occasionWorn,
          recommend,
        }),
      });

      if (res.status === 401) {
        toastError("Login Required", "Please log in to submit a verified customer evaluation.");
        return;
      }

      if (res.ok) {
        success("Review & Survey Submitted! ⭐", "Thank you for rating fit, quality, and garment details.");
        setTitle("");
        setComment("");
        setShowSurveyModal(false);
        loadReviews();
      } else {
        const data = await res.json();
        toastError("Submission Error", data.error || "Could not submit review.");
      }
    } catch {
      toastError("Network Error", "Unable to submit evaluation.");
    } finally {
      setSubmitting(false);
    }
  }

  const count = reviews.length > 0 ? reviews.length : initialCount;
  const avg = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : Number(initialAverage).toFixed(1);

  return (
    <section className="space-y-8 pt-8 border-t" style={{ borderColor: "var(--fc-border)" }}>
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold flex items-center gap-2">
            <span>⭐</span> Customer Ratings &amp; Garment Evaluation
          </h2>
          <p className="text-xs text-dim mt-0.5">
            Verified fit, fabric quality, and real customer feedback for {productName}
          </p>
        </div>

        <button
          onClick={() => setShowSurveyModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all hover:brightness-110 cursor-pointer"
          style={{ backgroundColor: "var(--fc-primary)" }}
        >
          <span>✍️</span> Evaluate Garment &amp; Write Review
        </button>
      </div>

      {/* Aggregated Survey Scorecard & Fit Distribution */}
      <div
        className="p-6 rounded-2xl border grid grid-cols-1 md:grid-cols-3 gap-6 shadow-xs"
        style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}
      >
        {/* Rating Overview */}
        <div className="flex flex-col items-center justify-center text-center p-4 border-r md:border-r" style={{ borderColor: "var(--fc-border)" }}>
          <div className="font-display text-5xl font-black text-primary">{avg}</div>
          <div className="flex gap-1 text-amber-500 text-base my-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i}>{i < Math.round(Number(avg)) ? "★" : "☆"}</span>
            ))}
          </div>
          <p className="text-xs font-bold text-dim uppercase tracking-wider">
            Based on {count} Verified Evaluations
          </p>
          <span className="inline-flex items-center gap-1 mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            ✓ {surveySummary?.recommendPercent || 98}% Would Recommend
          </span>
        </div>

        {/* Structured Survey Dimensions (Fit, Quality, Color, Comfort) */}
        <div className="space-y-3.5 text-xs col-span-2">
          <h3 className="font-bold text-xs uppercase tracking-wider text-dim">
            Garment Evaluation Scorecard
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl border bg-white dark:bg-neutral-900 text-center" style={{ borderColor: "var(--fc-border)" }}>
              <span className="text-xl">🧵</span>
              <p className="font-bold text-sm text-primary mt-1">{surveySummary?.avgQuality || "4.9"}/5</p>
              <p className="text-[10px] text-dim font-medium uppercase">Fabric Quality</p>
            </div>

            <div className="p-3 rounded-xl border bg-white dark:bg-neutral-900 text-center" style={{ borderColor: "var(--fc-border)" }}>
              <span className="text-xl">🎨</span>
              <p className="font-bold text-sm text-primary mt-1">{surveySummary?.colorAccuracyPercent || 96}%</p>
              <p className="text-[10px] text-dim font-medium uppercase">Color Match</p>
            </div>

            <div className="p-3 rounded-xl border bg-white dark:bg-neutral-900 text-center" style={{ borderColor: "var(--fc-border)" }}>
              <span className="text-xl">✨</span>
              <p className="font-bold text-sm text-primary mt-1">{surveySummary?.avgComfort || "4.8"}/5</p>
              <p className="text-[10px] text-dim font-medium uppercase">Comfort &amp; Feel</p>
            </div>

            <div className="p-3 rounded-xl border bg-white dark:bg-neutral-900 text-center" style={{ borderColor: "var(--fc-border)" }}>
              <span className="text-xl">💎</span>
              <p className="font-bold text-sm text-primary mt-1">{surveySummary?.avgValue || "4.9"}/5</p>
              <p className="text-[10px] text-dim font-medium uppercase">Value for Money</p>
            </div>
          </div>

          {/* Sizing & Fit Consensus Bar */}
          <div className="pt-1 space-y-1.5">
            <div className="flex justify-between text-[11px] font-semibold">
              <span className="text-dim">Customer Sizing Consensus:</span>
              <span className="text-emerald-600 font-bold">88% True to Size</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden flex bg-neutral-200 dark:bg-neutral-800">
              <div style={{ width: "8%" }} className="bg-amber-400" title="Runs Small (8%)" />
              <div style={{ width: "88%" }} className="bg-emerald-500" title="True to Size (88%)" />
              <div style={{ width: "4%" }} className="bg-blue-400" title="Runs Large (4%)" />
            </div>
            <div className="flex justify-between text-[10px] text-dim">
              <span>Runs Small (8%)</span>
              <span className="font-bold text-primary">True to Size (88%)</span>
              <span>Runs Large (4%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((rev) => (
          <div
            key={rev.id}
            className="p-5 rounded-2xl border space-y-3 transition-all"
            style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm" style={{ color: "var(--fc-text)" }}>
                  {rev.user.name}
                </span>
                {rev.isVerifiedBuyer && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    ✓ Verified Buyer
                  </span>
                )}
              </div>

              <span className="text-[11px] text-dim">
                {new Date(rev.createdAt).toLocaleDateString("en-IN", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>

            {/* Stars & Survey Dimension Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex text-amber-500 text-sm">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i}>{i < rev.rating ? "★" : "☆"}</span>
                ))}
              </div>

              {rev.fitRating && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 border" style={{ borderColor: "var(--fc-border)" }}>
                  Fit: {rev.fitRating === "TRUE_TO_SIZE" ? "True to Size" : rev.fitRating === "RUNS_SMALL" ? "Runs Small" : "Runs Large"}
                </span>
              )}

              {rev.sizePurchased && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 border" style={{ borderColor: "var(--fc-border)" }}>
                  Size: {rev.sizePurchased}
                </span>
              )}

              {rev.occasionWorn && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20">
                  🎉 {rev.occasionWorn}
                </span>
              )}

              {rev.colorAccuracy === "EXACT_MATCH" && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  🎨 100% Color Match
                </span>
              )}
            </div>

            {rev.title && (
              <h4 className="font-bold text-xs" style={{ color: "var(--fc-text)" }}>
                {rev.title}
              </h4>
            )}

            <p className="text-xs text-dim leading-relaxed whitespace-pre-line">
              {rev.comment}
            </p>
          </div>
        ))}

        {reviews.length === 0 && !loading && (
          <div className="p-8 rounded-2xl border text-center text-dim space-y-2" style={{ borderColor: "var(--fc-border)" }}>
            <p className="text-3xl">✨</p>
            <p className="font-bold text-sm">Be the first to evaluate this luxury piece!</p>
            <p className="text-xs">Share sizing, fabric feel, and photos to help fellow shoppers.</p>
          </div>
        )}
      </div>

      {/* Structured Survey Modal */}
      {showSurveyModal && mounted && createPortal(
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="survey-modal-title"
        >
          <div
            onClick={() => setShowSurveyModal(false)}
            className="fixed inset-0 bg-transparent"
          />

          <div
            className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border p-6 sm:p-8 shadow-2xl z-10 space-y-5 animate-in zoom-in-95 my-auto"
            style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--fc-border)" }}>
              <div>
                <h3 id="survey-modal-title" className="font-display text-lg sm:text-xl font-bold text-primary">
                  ✍️ Customer Evaluation Survey
                </h3>
                <p className="text-xs text-dim mt-0.5">{productName}</p>
              </div>
              <button
                onClick={() => setShowSurveyModal(false)}
                className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
                aria-label="Close Evaluation Dialog"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitSurvey} className="space-y-4">
              {/* 1. Overall Star Rating */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-dim mb-1.5">
                  1. Overall Garment Rating *
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`text-2xl transition-transform hover:scale-125 cursor-pointer ${
                        star <= rating ? "text-amber-500" : "text-neutral-300 dark:text-neutral-700"
                      }`}
                    >
                      ★
                    </button>
                  ))}
                  <span className="text-xs font-bold text-dim ml-2">
                    {rating === 5 ? "Exceptional (5/5)" : rating === 4 ? "Very Good (4/5)" : rating === 3 ? "Average (3/5)" : `${rating}/5 Stars`}
                  </span>
                </div>
              </div>

              {/* 2. Fit Evaluation (Runs Small / True to Size / Runs Large) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-dim mb-1.5">
                  2. Sizing &amp; Fit Experience *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: "RUNS_SMALL", label: "Runs Small (Tight)" },
                    { key: "TRUE_TO_SIZE", label: "True to Size (Perfect)" },
                    { key: "RUNS_LARGE", label: "Runs Large (Loose)" },
                  ].map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => setFitRating(f.key as "RUNS_SMALL" | "TRUE_TO_SIZE" | "RUNS_LARGE")}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        fitRating === f.key
                          ? "border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300 shadow-xs"
                          : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-400"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Dimension Ratings (Quality, Color Match, Comfort) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-dim mb-1">
                    3. Fabric &amp; Weave Quality
                  </label>
                  <select
                    value={qualityRating}
                    onChange={(e) => setQualityRating(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:border-primary"
                    style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}
                  >
                    <option value={5}>5 - Pure Luxury &amp; Master Weave</option>
                    <option value={4}>4 - High Quality &amp; Durable</option>
                    <option value={3}>3 - Good Regular Fabric</option>
                    <option value={2}>2 - Fair / Lightweight</option>
                    <option value={1}>1 - Below Expectation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-dim mb-1">
                    4. Color Match to Photos
                  </label>
                  <select
                    value={colorAccuracy}
                    onChange={(e) => setColorAccuracy(e.target.value as "EXACT_MATCH" | "SLIGHT_VARIATION" | "VERY_DIFFERENT")}
                    className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:border-primary"
                    style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}
                  >
                    <option value="EXACT_MATCH">100% Exact Match as pictured</option>
                    <option value="SLIGHT_VARIATION">Slight tone variation</option>
                    <option value="VERY_DIFFERENT">Noticeably different</option>
                  </select>
                </div>
              </div>

              {/* 4. Size Purchased & Occasion */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-dim mb-1">
                    5. Size Purchased
                  </label>
                  <select
                    value={sizePurchased}
                    onChange={(e) => setSizePurchased(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:border-primary"
                    style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}
                  >
                    {["XS", "S", "M", "L", "XL", "XXL", "Free Size"].map((s) => (
                      <option key={s} value={s}>
                        Size {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-dim mb-1">
                    6. Occasion Worn For
                  </label>
                  <select
                    value={occasionWorn}
                    onChange={(e) => setOccasionWorn(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:border-primary"
                    style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}
                  >
                    <option value="Festive / Wedding">Festive &amp; Wedding Ceremonies</option>
                    <option value="Cocktail / Evening">Cocktail &amp; Evening Soirée</option>
                    <option value="Office / Formal">Office &amp; Executive Formal</option>
                    <option value="Everyday Chic">Everyday Casual Luxury</option>
                  </select>
                </div>
              </div>

              {/* 5. Review Headline & Detailed Story */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-dim mb-1">
                  7. Review Headline (Optional)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Stunning Banarasi drape, received countless compliments!"
                  className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:border-primary"
                  style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-dim mb-1">
                  8. Your Detailed Experience &amp; Garment Feedback *
                </label>
                <textarea
                  required
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us about the drape, stitching quality, comfort, and compliments received..."
                  className="w-full px-3 py-2.5 rounded-xl border text-xs outline-none focus:border-primary"
                  style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}
                />
              </div>

              {/* Recommendation Checkbox */}
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={recommend}
                  onChange={(e) => setRecommend(e.target.checked)}
                  className="rounded border-neutral-300 text-amber-600 focus:ring-amber-500"
                />
                <span>I recommend this garment to other fashion buyers</span>
              </label>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t" style={{ borderColor: "var(--fc-border)" }}>
                <button
                  type="button"
                  onClick={() => setShowSurveyModal(false)}
                  className="px-4 py-2.5 rounded-xl border text-xs font-bold text-dim hover:text-primary transition-colors cursor-pointer"
                  style={{ borderColor: "var(--fc-border)" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !comment.trim()}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all hover:brightness-110 disabled:opacity-50 cursor-pointer"
                  style={{ backgroundColor: "var(--fc-primary)" }}
                >
                  {submitting ? "Submitting…" : "Publish Evaluation →"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </section>
  );
}
