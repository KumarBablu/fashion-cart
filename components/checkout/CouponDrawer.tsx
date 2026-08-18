"use client";

import { useEffect, useState } from "react";
import { formatINR } from "@/lib/format";

type ActiveCoupon = {
  id: string;
  code: string;
  description: string | null;
  discountType: string;
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount: number | null;
  endDate: string | null;
};

interface CouponDrawerProps {
  subtotal: number;
  onApply: (code: string) => void;
  appliedCode?: string | null;
}

export default function CouponDrawer({ subtotal, onApply, appliedCode }: CouponDrawerProps) {
  const [coupons, setCoupons] = useState<ActiveCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    async function loadCoupons() {
      try {
        const res = await fetch("/api/coupons/active");
        const data = await res.json();
        setCoupons(data.coupons || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadCoupons();
  }, []);

  if (coupons.length === 0 && !loading) return null;

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full p-3 rounded-xl border border-dashed text-left flex items-center justify-between text-xs transition-all hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer shadow-2xs group"
        style={{ borderColor: "var(--fc-primary)", backgroundColor: "rgba(197, 155, 39, 0.05)" }}
      >
        <div className="flex items-center gap-2">
          <span className="text-base">🎟️</span>
          <div>
            <p className="font-bold text-primary group-hover:underline">
              {appliedCode ? `Applied Coupon: ${appliedCode}` : "View Available Offers & Coupons"}
            </p>
            <p className="text-[11px] text-dim">
              {appliedCode ? "Tap to switch or view other offers" : `${coupons.length} luxury savings vouchers available`}
            </p>
          </div>
        </div>
        <span className="font-bold text-xs text-primary">Browse →</span>
      </button>

      {/* Modal Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 p-4 flex items-center justify-center animate-in fade-in duration-200">
          <div
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
          />

          <div
            className="relative w-full max-w-md max-h-[85vh] overflow-hidden rounded-2xl border shadow-2xl z-10 flex flex-col animate-in zoom-in-95"
            style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b flex items-center justify-between" style={{ borderColor: "var(--fc-border)" }}>
              <div>
                <h3 className="font-display text-base font-bold text-primary flex items-center gap-1.5">
                  <span>🎟️</span> Available Luxury Offers
                </h3>
                <p className="text-[11px] text-dim">Select an offer to apply instant savings</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* Coupons List */}
            <div className="p-4 sm:p-5 space-y-3 overflow-y-auto max-h-[60vh]">
              {coupons.map((cp) => {
                const isEligible = subtotal >= cp.minOrderAmount;
                const shortfall = cp.minOrderAmount - subtotal;
                const isCurrent = appliedCode === cp.code;

                let estimatedSaving = 0;
                if (cp.discountType === "PERCENTAGE") {
                  estimatedSaving = (subtotal * cp.discountValue) / 100;
                  if (cp.maxDiscountAmount && estimatedSaving > cp.maxDiscountAmount) {
                    estimatedSaving = cp.maxDiscountAmount;
                  }
                } else {
                  estimatedSaving = cp.discountValue;
                }

                return (
                  <div
                    key={cp.id}
                    className={`p-4 rounded-xl border transition-all space-y-2.5 ${
                      isCurrent
                        ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs"
                        : isEligible
                        ? "border-amber-500/40 bg-white dark:bg-neutral-900 shadow-2xs hover:border-amber-500"
                        : "border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 opacity-80"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-md text-xs font-mono font-extrabold uppercase tracking-wider bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                            {cp.code}
                          </span>
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            {cp.discountType === "PERCENTAGE" ? `${cp.discountValue}% OFF` : `Flat ${formatINR(cp.discountValue)} OFF`}
                          </span>
                        </div>

                        {cp.description && (
                          <p className="text-xs font-medium text-dim mt-1.5 leading-snug">
                            {cp.description}
                          </p>
                        )}
                      </div>

                      {/* Apply / Status Button */}
                      <div>
                        {isCurrent ? (
                          <span className="px-3 py-1.5 rounded-full text-[11px] font-bold bg-emerald-600 text-white">
                            ✓ Applied
                          </span>
                        ) : isEligible ? (
                          <button
                            type="button"
                            onClick={() => {
                              onApply(cp.code);
                              setIsOpen(false);
                            }}
                            className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-white shadow-xs transition-all hover:brightness-110 cursor-pointer"
                            style={{ backgroundColor: "var(--fc-primary)" }}
                          >
                            Apply
                          </button>
                        ) : (
                          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-neutral-200 dark:bg-neutral-800 text-neutral-500">
                            Locked
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress / Eligibility Bar */}
                    <div className="pt-1 text-[11px] border-t border-dashed border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                      {isEligible ? (
                        <span className="text-emerald-600 font-medium">
                          ✓ Saves {formatINR(Math.min(subtotal, Math.round(estimatedSaving)))} on this order
                        </span>
                      ) : (
                        <span className="text-amber-700 dark:text-amber-300 font-medium">
                          Add {formatINR(shortfall)} more to unlock this offer
                        </span>
                      )}
                      {cp.minOrderAmount > 0 && (
                        <span className="text-dim">Min: {formatINR(cp.minOrderAmount)}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-4 border-t text-center bg-neutral-50/50 dark:bg-neutral-900/50" style={{ borderColor: "var(--fc-border)" }}>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full py-2.5 rounded-xl border text-xs font-bold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                style={{ borderColor: "var(--fc-border)" }}
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
