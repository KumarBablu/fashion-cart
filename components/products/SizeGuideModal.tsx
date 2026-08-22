"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

export default function SizeGuideModal({
  isOpen,
  onClose,
  category = "Standard",
  isJewellery = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  category?: string;
  isJewellery?: boolean;
}) {
  const [unit, setUnit] = useState<"in" | "cm">("in");
  const [jewelleryTab, setJewelleryTab] = useState<"bangles" | "rings" | "necklaces">("bangles");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  // Garment charts
  const sizeChartInches = [
    { size: "S", chest: "36 - 38", waist: "30 - 32", shoulder: "17.0", length: "28.0" },
    { size: "M", chest: "38 - 40", waist: "32 - 34", shoulder: "17.5", length: "29.0" },
    { size: "L", chest: "40 - 42", waist: "34 - 36", shoulder: "18.0", length: "30.0" },
    { size: "XL", chest: "42 - 44", waist: "36 - 38", shoulder: "18.5", length: "31.0" },
    { size: "XXL", chest: "44 - 46", waist: "38 - 40", shoulder: "19.0", length: "31.5" },
  ];

  const sizeChartCm = [
    { size: "S", chest: "91 - 96", waist: "76 - 81", shoulder: "43.2", length: "71.1" },
    { size: "M", chest: "96 - 101", waist: "81 - 86", shoulder: "44.5", length: "73.6" },
    { size: "L", chest: "101 - 106", waist: "86 - 91", shoulder: "45.7", length: "76.2" },
    { size: "XL", chest: "106 - 112", waist: "91 - 96", shoulder: "47.0", length: "78.7" },
    { size: "XXL", chest: "112 - 117", waist: "96 - 101", shoulder: "48.3", length: "80.0" },
  ];

  // Jewellery charts
  const bangleChart = [
    { size: "2.4 (Small)", innerDiameter: "2.25 in (57.2 mm)", circumference: "7.06 in", fit: "Petite to Small Hands" },
    { size: "2.6 (Medium)", innerDiameter: "2.375 in (60.3 mm)", circumference: "7.45 in", fit: "Standard / Most Popular" },
    { size: "2.8 (Large)", innerDiameter: "2.50 in (63.5 mm)", circumference: "7.85 in", fit: "Broader Hand & Wrist" },
    { size: "Openable Kadas", innerDiameter: "Universal Fit", circumference: "Flexible", fit: "Side Screw / Lock (Fits all)" },
  ];

  const ringChart = [
    { indianSize: "Size 10 - 12", innerDiameter: "15.9 - 16.5 mm", usSize: "US 5 - 6", fit: "Pinky / Petite Fingers" },
    { indianSize: "Size 14 - 16", innerDiameter: "17.2 - 17.8 mm", usSize: "US 7 - 8", fit: "Ring / Middle Finger" },
    { indianSize: "Size 18 - 20", innerDiameter: "18.5 - 19.1 mm", usSize: "US 9 - 10", fit: "Index / Statement Thumb" },
    { indianSize: "Adjustable Bands", innerDiameter: "Flexible 15 - 20 mm", usSize: "Free Size", fit: "Smooth Expandable Band (Universal)" },
  ];

  const currentChart = unit === "in" ? sizeChartInches : sizeChartCm;

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] overflow-y-auto p-4 sm:p-6 md:p-10 flex items-center justify-center bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="size-guide-modal-title"
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div>
            <h3 id="size-guide-modal-title" className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>{isJewellery ? "💍" : "📏"}</span>
              <span>{isJewellery ? "Jewellery Sizing & Fit Guide" : "Size Chart & Fit Guide"}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isJewellery ? "Accurate measurements for bangles, rings, and necklace drops" : `Standardized sizing specifications for ${category}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-slate-200/60 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {isJewellery ? (
            /* JEWELLERY SIZING TABS */
            <div className="space-y-4">
              {/* Category Tab Pills */}
              <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-100 border border-slate-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setJewelleryTab("bangles")}
                  className={`flex-1 py-2 rounded-xl transition-all ${
                    jewelleryTab === "bangles" ? "bg-white text-slate-900 shadow-xs font-extrabold" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  ✨ Bangle Sizes (2.4 / 2.6 / 2.8)
                </button>
                <button
                  type="button"
                  onClick={() => setJewelleryTab("rings")}
                  className={`flex-1 py-2 rounded-xl transition-all ${
                    jewelleryTab === "rings" ? "bg-white text-slate-900 shadow-xs font-extrabold" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  💎 Ring Sizing
                </button>
                <button
                  type="button"
                  onClick={() => setJewelleryTab("necklaces")}
                  className={`flex-1 py-2 rounded-xl transition-all ${
                    jewelleryTab === "necklaces" ? "bg-white text-slate-900 shadow-xs font-extrabold" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  👑 Necklace Lengths
                </button>
              </div>

              {/* Bangle Chart */}
              {jewelleryTab === "bangles" && (
                <div className="space-y-3">
                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3">Indian Bangle Size</th>
                          <th className="px-4 py-3">Inner Diameter</th>
                          <th className="px-4 py-3">Circumference</th>
                          <th className="px-4 py-3">Recommended Hand Fit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {bangleChart.map((b, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3 font-bold text-slate-900">{b.size}</td>
                            <td className="px-4 py-3 text-slate-700">{b.innerDiameter}</td>
                            <td className="px-4 py-3 text-slate-700">{b.circumference}</td>
                            <td className="px-4 py-3 text-emerald-700 font-semibold">{b.fit}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
                    💡 <strong>Pro-Tip:</strong> To find your size, close your fingers as if wearing a bangle, measure the widest knuckles with a tape, and match the circumference above.
                  </div>
                </div>
              )}

              {/* Ring Chart */}
              {jewelleryTab === "rings" && (
                <div className="space-y-3">
                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3">Indian Ring Size</th>
                          <th className="px-4 py-3">Inside Diameter</th>
                          <th className="px-4 py-3">US / Global Equivalent</th>
                          <th className="px-4 py-3">Typical Wear</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {ringChart.map((r, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3 font-bold text-slate-900">{r.indianSize}</td>
                            <td className="px-4 py-3 text-slate-700">{r.innerDiameter}</td>
                            <td className="px-4 py-3 text-slate-700">{r.usSize}</td>
                            <td className="px-4 py-3 text-emerald-700 font-semibold">{r.fit}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Necklace Chart */}
              {jewelleryTab === "necklaces" && (
                <div className="space-y-3 text-xs text-slate-700">
                  <div className="p-4 rounded-2xl border border-slate-200 space-y-3 bg-slate-50/40">
                    <div className="flex items-start gap-3">
                      <span className="text-xl">👑</span>
                      <div>
                        <h4 className="font-bold text-slate-900">Choker Necklaces (14 – 16 inches)</h4>
                        <p className="text-slate-500 mt-0.5">Sits tightly or comfortably around the base of the throat. Includes an adjustable handmade silk thread Dori with tassel pull.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 pt-2 border-t border-slate-200">
                      <span className="text-xl">✨</span>
                      <div>
                        <h4 className="font-bold text-slate-900">Princess / Medium Sets (17 – 19 inches)</h4>
                        <p className="text-slate-500 mt-0.5">Rests gracefully over the collarbone. Ideal for sarees, lehengas, and sweetheart necklines.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 pt-2 border-t border-slate-200">
                      <span className="text-xl">📿</span>
                      <div>
                        <h4 className="font-bold text-slate-900">Temple Antique Long Haar (24 – 32 inches)</h4>
                        <p className="text-slate-500 mt-0.5">Dramatic cascading length down to the mid-chest, designed to be worn alone or layered with chokers.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* GARMENT SIZING TABLE */
            <div className="space-y-4">
              {/* Unit Toggle */}
              <div className="flex items-center justify-end gap-2">
                <span className="text-xs font-semibold text-slate-600">Measurement Unit:</span>
                <div className="inline-flex rounded-xl border border-slate-200 p-0.5 bg-slate-100 text-xs font-bold">
                  <button
                    onClick={() => setUnit("in")}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      unit === "in" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    Inches (in)
                  </button>
                  <button
                    onClick={() => setUnit("cm")}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      unit === "cm" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    Centimeters (cm)
                  </button>
                </div>
              </div>

              {/* Sizing Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Size</th>
                      <th className="px-4 py-3">Chest ({unit})</th>
                      <th className="px-4 py-3">Waist ({unit})</th>
                      <th className="px-4 py-3">Shoulder ({unit})</th>
                      <th className="px-4 py-3">Length ({unit})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentChart.map((row) => (
                      <tr key={row.size} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-bold text-slate-900">{row.size}</td>
                        <td className="px-4 py-3 text-slate-700">{row.chest}</td>
                        <td className="px-4 py-3 text-slate-700">{row.waist}</td>
                        <td className="px-4 py-3 text-slate-700">{row.shoulder}</td>
                        <td className="px-4 py-3 text-slate-700">{row.length}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
          <p className="text-[11px] text-slate-500">
            {isJewellery ? "✨ Need assistance with custom fits? Contact our styling concierge." : "✨ Measurements reflect standard body measurements with ease allowance."}
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
