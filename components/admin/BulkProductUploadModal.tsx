"use client";

import { useState, useRef } from "react";
import { useToast } from "@/components/providers/ToastProvider";
import DownloadCsvButton from "./DownloadCsvButton";

interface BulkProductUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BulkProductUploadModal({
  isOpen,
  onClose,
  onSuccess,
}: BulkProductUploadModalProps) {
  const { success, error: toastError } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    processedRows: number;
    productsCreated: number;
    productsUpdated: number;
    variantsCreatedOrUpdated: number;
    errors: string[];
  } | null>(null);

  if (!isOpen) return null;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) {
      if (!selected.name.endsWith(".csv")) {
        toastError("Invalid File Format", "Please select a standard .csv spreadsheet file.");
        return;
      }
      setFile(selected);
      setResult(null);
    }
  }

  async function handleUpload() {
    if (!file) {
      toastError("No File", "Please select a CSV file to upload.");
      return;
    }

    setUploading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/products/bulk-upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setUploading(false);

      if (!res.ok) {
        toastError("Upload Failed", data.error || "Could not process CSV upload.");
        return;
      }

      setResult(data);
      success(
        "Bulk Upload Completed 🎉",
        `Created ${data.productsCreated} products, updated ${data.productsUpdated}, synced ${data.variantsCreatedOrUpdated} variants!`
      );
      onSuccess();
    } catch (err) {
      setUploading(false);
      console.error(err);
      toastError("Error", "Network error during bulk CSV upload.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 p-4 flex items-center justify-center animate-in fade-in duration-150">
      <div onClick={onClose} className="fixed inset-0 bg-black/70 backdrop-blur-xs" />

      <div
        className="relative w-full max-w-2xl rounded-3xl p-6 sm:p-8 border shadow-2xl space-y-6 z-10 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto"
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
                Add or update unlimited products, categories, SKU variants, prices, and stock in one spreadsheet
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full border text-dim hover:text-primary flex items-center justify-center cursor-pointer transition-colors"
            style={{ borderColor: "var(--fc-border)" }}
          >
            ✕
          </button>
        </div>

        {/* Step 1: Template Download */}
        <div className="p-4 rounded-2xl border space-y-2.5 bg-amber-500/5" style={{ borderColor: "var(--fc-border)" }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                <span>📋</span> Step 1: Download Sample Upload Template
              </h4>
              <p className="text-[11px] text-dim mt-0.5">
                Download the official pre-formatted CSV template with example luxury apparel listings, sizes, and SKUs.
              </p>
            </div>
            <DownloadCsvButton
              type="template"
              label="Download Template CSV"
              icon="📋"
              className="bg-amber-600 hover:bg-amber-700 text-white border-transparent shrink-0"
            />
          </div>
        </div>

        {/* Step 2: File Picker */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-dim">
            Step 2: Select Your Prepared CSV File
          </label>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer hover:border-amber-500 transition-colors flex flex-col items-center justify-center gap-2"
            style={{ borderColor: "var(--fc-border)", backgroundColor: "var(--fc-bg)" }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />

            <span className="text-4xl">📄</span>
            {file ? (
              <div className="space-y-1">
                <p className="font-bold text-xs text-primary">{file.name}</p>
                <p className="text-[10px] text-dim">{(file.size / 1024).toFixed(1)} KB — Ready to upload</p>
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

        {/* Supported Columns Guide */}
        <div className="p-3.5 rounded-xl border text-[11px] space-y-1.5" style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}>
          <p className="font-bold text-dim uppercase text-[10px] tracking-wider">Supported CSV Column Headers:</p>
          <p className="font-mono text-[10px] text-primary break-all">
            Title, Slug, Department, Subcategory, Brand, Fabric, Description, Status, SKU, Colour, Size, Price, CompareAtPrice, StockQuantity, ImageURL
          </p>
          <p className="text-[10px] text-dim">
            ✦ Multiple rows with the same Title/Slug will automatically group as size/colour variants under that product.
          </p>
        </div>

        {/* Upload Results Summary */}
        {result && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2 animate-in fade-in">
            <h4 className="font-bold text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
              <span>✅</span> Bulk Upload Successfully Processed!
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center pt-1">
              <div className="p-2 rounded-xl bg-white/70 dark:bg-black/30 border border-emerald-500/20">
                <p className="text-[10px] text-dim">Processed</p>
                <p className="font-bold text-sm text-primary">{result.processedRows} rows</p>
              </div>
              <div className="p-2 rounded-xl bg-white/70 dark:bg-black/30 border border-emerald-500/20">
                <p className="text-[10px] text-dim">Created</p>
                <p className="font-bold text-sm text-emerald-600">{result.productsCreated} items</p>
              </div>
              <div className="p-2 rounded-xl bg-white/70 dark:bg-black/30 border border-emerald-500/20">
                <p className="text-[10px] text-dim">Updated</p>
                <p className="font-bold text-sm text-blue-600">{result.productsUpdated} items</p>
              </div>
              <div className="p-2 rounded-xl bg-white/70 dark:bg-black/30 border border-emerald-500/20">
                <p className="text-[10px] text-dim">Variants Synced</p>
                <p className="font-bold text-sm text-amber-600">{result.variantsCreatedOrUpdated} SKUs</p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="mt-2 text-[10px] text-rose-600 space-y-0.5">
                <p className="font-bold">Warnings on specific rows:</p>
                {result.errors.map((err, idx) => (
                  <p key={idx}>⚠️ {err}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t" style={{ borderColor: "var(--fc-border)" }}>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-dim hover:text-primary transition-colors cursor-pointer"
          >
            Close
          </button>

          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all hover:brightness-110 disabled:opacity-50 cursor-pointer"
            style={{ backgroundColor: "var(--fc-primary)" }}
          >
            {uploading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing CSV…</span>
              </>
            ) : (
              <>
                <span>📤</span>
                <span>Start Import &amp; Sync Catalog</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
