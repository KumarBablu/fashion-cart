"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { formatINR } from "@/lib/format";
import { useToast } from "@/components/providers/ToastProvider";
import { buildUpiPaymentUri, generateDynamicUpiQrDataUrl } from "@/lib/payments/upi";

type DynamicUpiQrProps = {
  upiId: string;
  amount: number;
  orderNumber: string;
  payeeName?: string;
  staticQrPath?: string | null;
};

export default function DynamicUpiQr({
  upiId,
  amount,
  orderNumber,
  payeeName = "Fashion Cart Premium Outlet",
  staticQrPath,
}: DynamicUpiQrProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"DYNAMIC" | "STATIC">("DYNAMIC");
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const { success } = useToast();

  const upiUri = buildUpiPaymentUri({
    upiId,
    payeeName,
    amount,
    orderNumber,
  });

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);

    generateDynamicUpiQrDataUrl({
      upiId,
      payeeName,
      amount,
      orderNumber,
    })
      .then((dataUrl) => {
        if (!isCancelled) {
          setQrDataUrl(dataUrl);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Dynamic QR generation failed:", err);
        if (!isCancelled) setLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [upiId, payeeName, amount, orderNumber]);

  function copyUpiId() {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
    success("UPI ID Copied to Clipboard!", upiId);
  }

  function copyAmount() {
    navigator.clipboard.writeText(amount.toString());
    setCopiedAmount(true);
    setTimeout(() => setCopiedAmount(false), 2000);
    success("Amount Copied to Clipboard!", formatINR(amount));
  }

  return (
    <div className="space-y-5">
      {/* Mode Switcher Tab (if Admin has uploaded a static boutique banner QR) */}
      {staticQrPath && (
        <div className="flex p-1 rounded-2xl bg-[#F0EBE4] dark:bg-neutral-800/80 border border-[#E2D8CC] dark:border-neutral-700 max-w-sm mx-auto shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab("DYNAMIC")}
            className={`flex-1 py-2 px-3.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "DYNAMIC"
                ? "bg-[#141416] text-white shadow-md scale-[1.02]"
                : "text-[#6B7280] hover:text-[#141416] dark:hover:text-white"
            }`}
          >
            <span className="text-amber-400">✨</span>
            <span>Dynamic QR ({formatINR(amount)})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("STATIC")}
            className={`flex-1 py-2 px-3.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "STATIC"
                ? "bg-[#141416] text-white shadow-md scale-[1.02]"
                : "text-[#6B7280] hover:text-[#141416] dark:hover:text-white"
            }`}
          >
            <span>🏛️</span>
            <span>Store Master QR</span>
          </button>
        </div>
      )}

      {/* Main Luxury QR Code Frame */}
      <div className="flex flex-col items-center justify-center">
        <div className="relative group">
          {/* Subtle Golden Glow behind QR Frame */}
          <div className="absolute -inset-1.5 bg-gradient-to-r from-[#C59B27]/30 via-amber-200/20 to-[#C59B27]/30 rounded-[32px] blur-sm opacity-70 group-hover:opacity-100 transition duration-500" />
          
          <div
            className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-[28px] border-2 p-4 bg-white shadow-2xl flex flex-col items-center justify-center transition-all"
            style={{ borderColor: "#C59B27" }}
          >
            {/* Elegant Corner Ornaments */}
            <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-[#C59B27]" />
            <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-[#C59B27]" />
            <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-[#C59B27]" />
            <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-[#C59B27]" />

            {activeTab === "DYNAMIC" ? (
              qrDataUrl && !loading ? (
                <div className="relative w-full h-full animate-in zoom-in-95 duration-300">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrDataUrl}
                    alt={`NPCI Dynamic UPI QR Code for ${formatINR(amount)}`}
                    className="w-full h-full object-contain"
                  />
                  {/* Luxury Center Embellishment Badge */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-white p-1 rounded-xl shadow-lg border border-[#C59B27]/60 flex items-center justify-center">
                      <div className="px-1.5 py-0.5 rounded-lg bg-gradient-to-br from-[#141416] to-[#2B2C30] text-[#C59B27] font-black text-xs shadow-inner">
                        ₹
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-[#787C87] space-y-3">
                  <div className="w-9 h-9 border-3 border-[#C59B27] border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-bold tracking-wider uppercase text-[#141416]">Encoding Dynamic QR…</span>
                </div>
              )
            ) : staticQrPath ? (
              <div className="relative w-full h-full">
                <Image
                  src={staticQrPath}
                  alt="Boutique Master UPI QR"
                  fill
                  unoptimized
                  className="object-contain p-1"
                  priority
                />
              </div>
            ) : null}
          </div>
        </div>

        {/* Live Session Status Pill with Pulsing Green Dot */}
        {activeTab === "DYNAMIC" && (
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-[#FAF6EE] text-[#8E6C0C] border border-[#E7D6A8] shadow-xs animate-in fade-in">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>
              Scans automatically auto-fill & lock: <strong className="text-[#141416] font-black">{formatINR(amount)}</strong>
            </span>
          </div>
        )}

        {/* Store UPI ID & Quick Copy Strip */}
        <div
          className="mt-4 w-full max-w-md flex items-center justify-between p-3.5 rounded-2xl border bg-[#FAF8F5] dark:bg-neutral-900 shadow-xs"
          style={{ borderColor: "#E7DFD5" }}
        >
          <div className="text-left pl-1 min-w-0 pr-2">
            <p className="text-[9px] text-[#787C87] uppercase tracking-wider font-extrabold">Verified Store VPA / UPI ID</p>
            <p className="font-mono font-black text-xs sm:text-sm text-[#141416] dark:text-white truncate tracking-wide">{upiId}</p>
          </div>
          
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={copyAmount}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer shadow-2xs ${
                copiedAmount
                  ? "bg-emerald-600 border-emerald-600 text-white"
                  : "bg-white dark:bg-neutral-800 border-[#D9D0C5] text-[#141416] dark:text-white hover:border-[#C59B27]"
              }`}
              title="Copy Exact Amount"
            >
              {copiedAmount ? "✓ Copied" : "Copy ₹"}
            </button>

            <button
              type="button"
              onClick={copyUpiId}
              className={`px-3.5 py-1.5 rounded-xl text-[11px] font-extrabold uppercase tracking-wider transition-all cursor-pointer shadow-xs ${
                copiedUpi
                  ? "bg-emerald-600 text-white"
                  : "bg-[#141416] text-[#C59B27] hover:bg-[#25262B] hover:text-white"
              }`}
              title="Copy UPI ID"
            >
              {copiedUpi ? "✓ Copied" : "Copy UPI"}
            </button>
          </div>
        </div>
      </div>

      {/* Direct One-Tap Mobile UPI App Launchers */}
      <div className="pt-2">
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="h-[1px] w-8 bg-[#E7DFD5]" />
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#787C87]">
            Or Pay Directly via Mobile App
          </p>
          <span className="h-[1px] w-8 bg-[#E7DFD5]" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-md mx-auto">
          {/* Google Pay */}
          <a
            href={upiUri}
            className="group relative flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl border border-[#E7DFD5] bg-white dark:bg-neutral-900 shadow-2xs hover:shadow-md hover:border-[#4285F4] hover:-translate-y-0.5 active:scale-95 transition-all"
          >
            <span className="w-5 h-5 rounded-full bg-[#F1F5F9] flex items-center justify-center text-[10px] font-black text-[#4285F4]">G</span>
            <span className="text-xs font-extrabold text-[#141416] dark:text-white group-hover:text-[#4285F4] transition-colors">Google Pay</span>
          </a>

          {/* PhonePe */}
          <a
            href={upiUri}
            className="group relative flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl border border-[#E7DFD5] bg-white dark:bg-neutral-900 shadow-2xs hover:shadow-md hover:border-[#5F259F] hover:-translate-y-0.5 active:scale-95 transition-all"
          >
            <span className="w-5 h-5 rounded-full bg-[#5F259F] flex items-center justify-center text-[10px] font-black text-white">P</span>
            <span className="text-xs font-extrabold text-[#141416] dark:text-white group-hover:text-[#5F259F] transition-colors">PhonePe</span>
          </a>

          {/* Paytm */}
          <a
            href={upiUri}
            className="group relative flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl border border-[#E7DFD5] bg-white dark:bg-neutral-900 shadow-2xs hover:shadow-md hover:border-[#00BAF2] hover:-translate-y-0.5 active:scale-95 transition-all"
          >
            <span className="w-5 h-5 rounded-full bg-[#00BAF2] flex items-center justify-center text-[10px] font-black text-white">₹</span>
            <span className="text-xs font-extrabold text-[#141416] dark:text-white group-hover:text-[#00BAF2] transition-colors">Paytm</span>
          </a>

          {/* BHIM / CRED */}
          <a
            href={upiUri}
            className="group relative flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl border border-[#E7DFD5] bg-white dark:bg-neutral-900 shadow-2xs hover:shadow-md hover:border-[#C59B27] hover:-translate-y-0.5 active:scale-95 transition-all"
          >
            <span className="w-5 h-5 rounded-full bg-[#141416] flex items-center justify-center text-[10px] font-black text-[#C59B27]">⚡</span>
            <span className="text-xs font-extrabold text-[#141416] dark:text-white group-hover:text-[#C59B27] transition-colors">Any UPI</span>
          </a>
        </div>
      </div>
    </div>
  );
}
