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
    success("UPI ID Copied!", upiId);
  }

  function copyAmount() {
    navigator.clipboard.writeText(amount.toString());
    success("Amount Copied!", formatINR(amount));
  }

  return (
    <div className="space-y-4">
      {/* Tab Selector if Admin has uploaded a static QR */}
      {staticQrPath && (
        <div className="flex rounded-xl p-1 bg-[#F4EFEA] dark:bg-neutral-800 border border-[#E7DFD5] text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("DYNAMIC")}
            className={`flex-1 py-2 px-3 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "DYNAMIC"
                ? "bg-[#141416] text-white shadow-xs"
                : "text-dim hover:text-primary"
            }`}
          >
            <span>🎯</span>
            <span>Dynamic Amount QR ({formatINR(amount)})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("STATIC")}
            className={`flex-1 py-2 px-3 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "STATIC"
                ? "bg-[#141416] text-white shadow-xs"
                : "text-dim hover:text-primary"
            }`}
          >
            <span>🏛️</span>
            <span>Boutique Merchant QR</span>
          </button>
        </div>
      )}

      {/* Main QR Card Container */}
      <div className="flex flex-col items-center justify-center">
        <div
          className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-3xl border-2 p-3.5 bg-white shadow-xl flex flex-col items-center justify-center transition-all animate-in zoom-in-95"
          style={{ borderColor: "var(--fc-primary)" }}
        >
          {activeTab === "DYNAMIC" ? (
            qrDataUrl && !loading ? (
              <div className="relative w-full h-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrDataUrl}
                  alt={`Dynamic UPI QR Code for ${formatINR(amount)}`}
                  className="w-full h-full object-contain"
                />
                {/* Center Badge Indicator */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-white p-1 rounded-lg shadow-md border border-[#C59B27]/40 flex items-center justify-center">
                    <span className="text-xs font-black text-[#141416] px-1 bg-[#FBF4E2] rounded">
                      ₹
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-dim space-y-2">
                <span className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-bold">Generating Dynamic QR…</span>
              </div>
            )
          ) : staticQrPath ? (
            <div className="relative w-full h-full">
              <Image
                src={staticQrPath}
                alt="Boutique Static UPI QR"
                fill
                unoptimized
                className="object-contain p-2"
                priority
              />
            </div>
          ) : null}
        </div>

        {/* Dynamic Amount Verification Badge */}
        {activeTab === "DYNAMIC" && (
          <div className="mt-3.5 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-extrabold bg-[#FBF4E2] text-[#8E6C0C] border border-[#C59B27]/40 shadow-xs animate-in fade-in">
            <span className="text-sm">✨</span>
            <span>Scans will auto-fill exact payable: <strong className="text-[#141416]">{formatINR(amount)}</strong></span>
          </div>
        )}

        {/* UPI Details Box with 1-Click Copy */}
        <div
          className="mt-4 w-full max-w-sm flex items-center justify-between p-3 rounded-2xl border text-xs shadow-2xs"
          style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}
        >
          <div className="text-left">
            <p className="text-[10px] text-dim uppercase tracking-wider font-semibold">Store UPI ID</p>
            <p className="font-mono font-black text-primary text-xs sm:text-sm">{upiId}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={copyAmount}
              className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold border hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer"
              style={{ borderColor: "var(--fc-border)" }}
              title="Copy Exact Amount"
            >
              Copy ₹
            </button>
            <button
              type="button"
              onClick={copyUpiId}
              className="px-3 py-1.5 rounded-xl text-[11px] font-bold text-white shadow-xs hover:brightness-110 transition-all cursor-pointer"
              style={{ backgroundColor: "var(--fc-primary)" }}
            >
              Copy UPI ID
            </button>
          </div>
        </div>
      </div>

      {/* Direct UPI App Launchers for Mobile */}
      <div className="pt-2">
        <p className="text-xs font-bold text-dim uppercase tracking-wider mb-2.5">
          Tap to Open Directly on Phone:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-w-md mx-auto">
          <a
            href={upiUri}
            className="py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all hover:border-[#C59B27] hover:scale-102 shadow-2xs bg-white dark:bg-neutral-900"
            style={{ borderColor: "var(--fc-border)" }}
          >
            <span>⚡</span>
            <span>Google Pay</span>
          </a>
          <a
            href={upiUri}
            className="py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all hover:border-[#C59B27] hover:scale-102 shadow-2xs bg-white dark:bg-neutral-900"
            style={{ borderColor: "var(--fc-border)" }}
          >
            <span>🟣</span>
            <span>PhonePe</span>
          </a>
          <a
            href={upiUri}
            className="py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all hover:border-[#C59B27] hover:scale-102 shadow-2xs bg-white dark:bg-neutral-900"
            style={{ borderColor: "var(--fc-border)" }}
          >
            <span>🔵</span>
            <span>Paytm</span>
          </a>
          <a
            href={upiUri}
            className="py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all hover:border-[#C59B27] hover:scale-102 shadow-2xs bg-white dark:bg-neutral-900"
            style={{ borderColor: "var(--fc-border)" }}
          >
            <span>🇮🇳</span>
            <span>BHIM / Any UPI</span>
          </a>
        </div>
      </div>
    </div>
  );
}
