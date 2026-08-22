"use client";

import { useState, useRef, useEffect } from "react";
import { useToast } from "@/components/providers/ToastProvider";
import DownloadCsvButton from "./DownloadCsvButton";

interface BulkProductUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Robust CSV parser handling multiline values, escaped quotes, and commas
function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentCell += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = "";
    } else if ((char === "\n" || (char === "\r" && nextChar === "\n")) && !insideQuotes) {
      if (char === "\r") i++;
      currentRow.push(currentCell.trim());
      if (currentRow.some((c) => c.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = "";
    } else {
      currentCell += char;
    }
  }

  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((c) => c.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

// Robust CSV row serializer
function serializeCsvRows(rows: string[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const str = cell ?? "";
          if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(",")
    )
    .join("\n");
}

export default function BulkProductUploadModal({
  isOpen,
  onClose,
  onSuccess,
}: BulkProductUploadModalProps) {
  const { success, error: toastError } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [targetStore, setTargetStore] = useState<"garments" | "jewellery">("garments");
  const [file, setFile] = useState<File | null>(null);
  const [totalRowsFound, setTotalRowsFound] = useState<number>(0);
  const [uploading, setUploading] = useState(false);

  // Live Batch Progress State
  const [progressState, setProgressState] = useState<{
    currentBatch: number;
    totalBatches: number;
    percent: number;
    processedRows: number;
    totalRows: number;
    productsCreated: number;
    productsUpdated: number;
    variantsCreatedOrUpdated: number;
    currentRange: string;
  } | null>(null);

  const [result, setResult] = useState<{
    success: boolean;
    processedRows: number;
    productsCreated: number;
    productsUpdated: number;
    variantsCreatedOrUpdated: number;
    errors: string[];
  } | null>(null);

  useEffect(() => {
    if (typeof document !== "undefined") {
      const isJewel = document.cookie.includes("fc_admin_store=jewellery");
      if (isJewel) setTargetStore("jewellery");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) {
      if (!selected.name.endsWith(".csv")) {
        toastError("Invalid File Format", "Please select a standard .csv spreadsheet file.");
        return;
      }
      setFile(selected);
      setResult(null);
      setProgressState(null);

      // Pre-parse to show instant row count
      try {
        const text = await selected.text();
        const rows = parseCsvRows(text);
        const dataRowCount = Math.max(0, rows.length - 1);
        setTotalRowsFound(dataRowCount);
      } catch {
        setTotalRowsFound(0);
      }
    }
  }

  async function handleUpload() {
    if (!file) {
      toastError("No File", "Please select a CSV file to upload.");
      return;
    }

    setUploading(true);
    setResult(null);

    try {
      const fullText = await file.text();
      const allRows = parseCsvRows(fullText);

      if (allRows.length < 2) {
        setUploading(false);
        toastError("Empty CSV", "CSV file contains no product rows (only header or empty).");
        return;
      }

      const headerRow = allRows[0];
      const dataRows = allRows.slice(1);
      const totalRows = dataRows.length;

      // Resilient batch size: 10 items per batch
      const BATCH_SIZE = 10;
      const totalBatches = Math.ceil(totalRows / BATCH_SIZE);

      let cumulativeProcessed = 0;
      let cumulativeCreated = 0;
      let cumulativeUpdated = 0;
      let cumulativeVariants = 0;
      const accumulatedErrors: string[] = [];

      for (let b = 0; b < totalBatches; b++) {
        const batchStart = b * BATCH_SIZE;
        const batchEnd = Math.min((b + 1) * BATCH_SIZE, totalRows);
        const batchData = dataRows.slice(batchStart, batchEnd);
        const batchRows = [headerRow, ...batchData];
        const batchCsv = serializeCsvRows(batchRows);

        // Update live progress indicator
        const currentPercent = Math.round(((b) / totalBatches) * 100);
        setProgressState({
          currentBatch: b + 1,
          totalBatches,
          percent: currentPercent,
          processedRows: cumulativeProcessed,
          totalRows,
          productsCreated: cumulativeCreated,
          productsUpdated: cumulativeUpdated,
          variantsCreatedOrUpdated: cumulativeVariants,
          currentRange: `${batchStart + 1} - ${batchEnd}`,
        });

        // Resilient fetch with automatic 1-retry fallback
        let batchSuccess = false;
        for (let attempt = 1; attempt <= 2 && !batchSuccess; attempt++) {
          try {
            const res = await fetch(`/api/admin/products/bulk-upload?store=${targetStore}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ csvText: batchCsv }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
              cumulativeProcessed += data.processedRows || batchData.length;
              cumulativeCreated += data.productsCreated || 0;
              cumulativeUpdated += data.productsUpdated || 0;
              cumulativeVariants += data.variantsCreatedOrUpdated || 0;
              if (Array.isArray(data.errors) && data.errors.length > 0) {
                accumulatedErrors.push(...data.errors);
              }
              batchSuccess = true;
            } else if (attempt === 2) {
              console.warn(`Batch ${b + 1} issue:`, data.error);
              accumulatedErrors.push(`Batch ${b + 1} (Rows ${batchStart + 1}-${batchEnd}): ${data.error || "Batch failed"}`);
            }
          } catch (batchErr) {
            if (attempt === 2) {
              console.error(`Batch ${b + 1} network error:`, batchErr);
              accumulatedErrors.push(`Batch ${b + 1} (Rows ${batchStart + 1}-${batchEnd}): Network timeout or connection drop`);
            } else {
              await new Promise((r) => setTimeout(r, 500));
            }
          }
        }
      }

      setUploading(false);
      setProgressState(null);

      const finalResult = {
        success: true,
        processedRows: cumulativeProcessed,
        productsCreated: cumulativeCreated,
        productsUpdated: cumulativeUpdated,
        variantsCreatedOrUpdated: cumulativeVariants,
        errors: accumulatedErrors,
      };

      setResult(finalResult);
      if (cumulativeProcessed > 0) {
        success(
          "Bulk Upload Completed 🎉",
          `Successfully processed ${cumulativeProcessed} rows into ${targetStore.toUpperCase()} (${cumulativeCreated} created, ${cumulativeUpdated} updated, ${cumulativeVariants} SKUs synced)!`
        );
        onSuccess();
      } else {
        toastError(
          "Upload Incomplete",
          "No rows were processed. Please check the error warnings below."
        );
      }
    } catch (err: any) {
      setUploading(false);
      console.error(err);
      toastError("Upload Error", err.message || "Failed to process CSV file.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 p-4 flex items-center justify-center animate-in fade-in duration-150">
      <div onClick={uploading ? undefined : onClose} className="fixed inset-0 bg-black/75 backdrop-blur-xs" />

      <div
        className="relative w-full max-w-2xl rounded-3xl p-6 sm:p-8 border shadow-2xl space-y-6 z-10 animate-in zoom-in-95 max-h-[92vh] overflow-y-auto"
        style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: "var(--fc-border)" }}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">📤</span>
            <div>
              <h2 className="font-display text-xl font-bold" style={{ color: "var(--fc-text)" }}>
                Bulk CSV Product &amp; Variant Upload
              </h2>
              <p className="text-xs text-dim mt-0.5">
                Multi-Store Database Engine · Supports 72-Column Jewellery &amp; Garments CSVs
              </p>
            </div>
          </div>
          {!uploading && (
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-full border text-dim hover:text-primary flex items-center justify-center cursor-pointer transition-colors"
              style={{ borderColor: "var(--fc-border)" }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Store Selection Pills */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          <span className="text-xs font-bold text-neutral-600 dark:text-neutral-300">
            Target Destination Store:
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTargetStore("jewellery")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                targetStore === "jewellery"
                  ? "bg-[#C59B27] text-white shadow-sm"
                  : "bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:border-[#C59B27] border border-neutral-200 dark:border-neutral-700"
              }`}
            >
              💍 Jewellery Store
            </button>
            <button
              type="button"
              onClick={() => setTargetStore("garments")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                targetStore === "garments"
                  ? "bg-[#141416] text-white shadow-sm"
                  : "bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:border-[#141416] border border-neutral-200 dark:border-neutral-700"
              }`}
            >
              👗 Garments Store
            </button>
          </div>
        </div>

        {/* Step 1: Download Templates */}
        <div className="p-4 rounded-2xl border space-y-3 bg-amber-500/5" style={{ borderColor: "var(--fc-border)" }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                <span>📋</span> Step 1: Download Sample Upload Template
              </h4>
              <p className="text-[11px] text-dim mt-0.5">
                Choose the official template formatted for your catalogue.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <DownloadCsvButton
                type="template"
                label="Garments Template"
                icon="👗"
                className="bg-neutral-800 hover:bg-neutral-900 text-white border-transparent shrink-0"
              />
              <a
                href="/api/admin/export?type=jewellery-template"
                download="fashion-cart-jewellery-72col-template.csv"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#C59B27] hover:bg-[#B0881E] text-white transition-all duration-200 cursor-pointer shadow-sm shrink-0"
              >
                <span>💍</span>
                <span>Jewellery (72 Cols)</span>
              </a>
            </div>
          </div>
        </div>

        {/* Step 2: File Picker */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-dim">
            Step 2: Select Your Prepared CSV File
          </label>

          <div
            onClick={() => !uploading && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-colors flex flex-col items-center justify-center gap-2 ${
              uploading ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:border-[#C59B27]"
            }`}
            style={{ borderColor: "var(--fc-border)", backgroundColor: "var(--fc-bg)" }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              disabled={uploading}
              onChange={handleFileChange}
              className="hidden"
            />

            <span className="text-4xl">📄</span>
            {file ? (
              <div className="space-y-1.5 text-center">
                <p className="font-bold text-xs text-primary">{file.name}</p>
                <div className="flex items-center justify-center gap-2 text-[11px]">
                  <span className="px-2.5 py-0.5 rounded-full font-bold bg-[#C59B27]/15 text-[#C59B27] border border-[#C59B27]/30">
                    📊 {totalRowsFound} Products Detected
                  </span>
                  <span className="text-dim">({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="font-bold text-xs" style={{ color: "var(--fc-text)" }}>
                  Click to choose file or drag and drop CSV here
                </p>
                <p className="text-[10px] text-dim">Standard comma-separated .csv file (UTF-8)</p>
              </div>
            )}
          </div>
        </div>

        {/* Live Upload Progress Engine */}
        {uploading && progressState && (
          <div className="p-5 rounded-2xl bg-[#141416] text-white border border-slate-700 shadow-xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C59B27] pulse-dot" />
                <span className="text-xs font-bold tracking-wide">
                  Processing Batch {progressState.currentBatch} of {progressState.totalBatches}
                </span>
              </div>
              <span className="text-xs font-mono font-black text-[#C59B27]">
                {progressState.percent}%
              </span>
            </div>

            {/* Visual Animated Progress Bar */}
            <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden relative border border-slate-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#C59B27] via-[#E8D8A0] to-[#C59B27] transition-all duration-300 ease-out"
                style={{ width: `${progressState.percent}%` }}
              />
            </div>

            <p className="text-[11px] text-slate-300 flex items-center justify-between">
              <span>⚡ Uploading to {targetStore.toUpperCase()} {progressState.currentRange} of {progressState.totalRows}…</span>
              <span className="font-mono text-slate-400">Do not close window</span>
            </p>

            {/* Live KPI Counters */}
            <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-slate-800">
              <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                <p className="text-[9.5px] text-slate-400">Processed</p>
                <p className="font-bold font-mono text-xs text-white">{progressState.processedRows} / {progressState.totalRows}</p>
              </div>
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-[9.5px] text-emerald-400">Created</p>
                <p className="font-bold font-mono text-xs text-emerald-400">{progressState.productsCreated}</p>
              </div>
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <p className="text-[9.5px] text-amber-400">Variants Synced</p>
                <p className="font-bold font-mono text-xs text-amber-400">{progressState.variantsCreatedOrUpdated}</p>
              </div>
            </div>
          </div>
        )}

        {/* Final Upload Results Summary */}
        {result && (
          <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3 animate-in fade-in">
            <h4 className="font-bold text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
              <span>🎉</span> All {result.processedRows} Rows Successfully Processed!
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center pt-1">
              <div className="p-2.5 rounded-xl bg-white/80 dark:bg-black/40 border border-emerald-500/20">
                <p className="text-[10px] text-dim">Total Processed</p>
                <p className="font-bold text-sm text-primary">{result.processedRows} rows</p>
              </div>
              <div className="p-2.5 rounded-xl bg-white/80 dark:bg-black/40 border border-emerald-500/20">
                <p className="text-[10px] text-dim">New Products</p>
                <p className="font-bold text-sm text-emerald-600">+{result.productsCreated}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-white/80 dark:bg-black/40 border border-emerald-500/20">
                <p className="text-[10px] text-dim">Updated</p>
                <p className="font-bold text-sm text-blue-600">{result.productsUpdated}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-white/80 dark:bg-black/40 border border-emerald-500/20">
                <p className="text-[10px] text-dim">SKUs Synced</p>
                <p className="font-bold text-sm text-amber-600">{result.variantsCreatedOrUpdated}</p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="pt-2 border-t border-emerald-500/20 space-y-1">
                <p className="text-[11px] font-bold text-amber-700">Noticeable Rows with Warnings:</p>
                <ul className="text-[10px] text-dim space-y-0.5 max-h-24 overflow-y-auto font-mono bg-white/50 p-2 rounded-lg">
                  {result.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t" style={{ borderColor: "var(--fc-border)" }}>
          <button
            type="button"
            disabled={uploading}
            onClick={onClose}
            className="px-5 py-2.5 rounded-full border text-xs font-semibold hover:bg-black/5 disabled:opacity-50 cursor-pointer"
            style={{ borderColor: "var(--fc-border)" }}
          >
            {result ? "Close" : "Cancel"}
          </button>

          {!result && (
            <button
              type="button"
              disabled={!file || uploading}
              onClick={handleUpload}
              className="px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all cursor-pointer disabled:opacity-50 bg-[#141416] hover:bg-[#25262B] active:scale-95"
            >
              {uploading ? "Processing Batch…" : `Start Upload (${totalRowsFound} items) →`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
