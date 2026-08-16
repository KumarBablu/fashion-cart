"use client";

import { useState } from "react";

export default function SizeGuideModal({
  isOpen,
  onClose,
  category = "Standard",
}: {
  isOpen: boolean;
  onClose: () => void;
  category?: string;
}) {
  const [unit, setUnit] = useState<"in" | "cm">("in");

  if (!isOpen) return null;

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

  const currentChart = unit === "in" ? sizeChartInches : sizeChartCm;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-10 flex items-center justify-center animate-in fade-in duration-200">
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
      />

      <div
        className="relative w-full max-w-xl rounded-2xl shadow-2xl border overflow-hidden z-10 animate-in zoom-in-95 duration-200"
        style={{
          backgroundColor: "var(--fc-surface)",
          borderColor: "var(--fc-border)",
          color: "var(--fc-text)",
        }}
      >
        <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: "var(--fc-border)" }}>
          <div>
            <h3 className="font-display text-xl font-bold">Size Guide & Fit Chart</h3>
            <p className="text-xs text-dim mt-0.5">{category} Apparel Measurements</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-xs font-bold"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Unit Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-dim uppercase">Measurement Unit</span>
            <div className="flex rounded-lg border p-0.5 text-xs font-medium" style={{ borderColor: "var(--fc-border)" }}>
              <button
                onClick={() => setUnit("in")}
                className={`px-3 py-1 rounded-md transition-all ${
                  unit === "in" ? "font-bold shadow-xs text-white" : "opacity-70 hover:opacity-100"
                }`}
                style={{
                  backgroundColor: unit === "in" ? "var(--fc-primary)" : "transparent",
                }}
              >
                Inches (in)
              </button>
              <button
                onClick={() => setUnit("cm")}
                className={`px-3 py-1 rounded-md transition-all ${
                  unit === "cm" ? "font-bold shadow-xs text-white" : "opacity-70 hover:opacity-100"
                }`}
                style={{
                  backgroundColor: unit === "cm" ? "var(--fc-primary)" : "transparent",
                }}
              >
                Centimeters (cm)
              </button>
            </div>
          </div>

          {/* Measurements Table */}
          <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--fc-border)" }}>
            <table className="w-full text-left text-xs">
              <thead className="border-b font-bold uppercase tracking-wider" style={{ backgroundColor: "var(--fc-bg-subtle)", borderColor: "var(--fc-border)" }}>
                <tr>
                  <th className="px-4 py-3">Size</th>
                  <th className="px-4 py-3">Chest / Bust</th>
                  <th className="px-4 py-3">Waist</th>
                  <th className="px-4 py-3">Shoulder</th>
                  <th className="px-4 py-3">Length</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--fc-border)" }}>
                {currentChart.map((row) => (
                  <tr key={row.size} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 font-bold text-primary">{row.size}</td>
                    <td className="px-4 py-3">{row.chest}</td>
                    <td className="px-4 py-3">{row.waist}</td>
                    <td className="px-4 py-3">{row.shoulder}</td>
                    <td className="px-4 py-3">{row.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* How to measure tips */}
          <div className="p-4 rounded-xl border space-y-2 text-xs" style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}>
            <p className="font-bold text-primary uppercase tracking-wider">How To Measure:</p>
            <ul className="list-disc list-inside space-y-1 text-dim">
              <li><strong>Chest:</strong> Measure around the fullest part of your chest, keeping the tape horizontal.</li>
              <li><strong>Waist:</strong> Measure around your natural waistline, where your trousers usually sit.</li>
              <li><strong>Shoulder:</strong> Measure from the edge of one shoulder bone across the back to the other.</li>
              <li><strong>Length:</strong> Measure from the highest point of the shoulder down to the hem.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
