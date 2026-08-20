"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { formatINR } from "@/lib/format";
import { useToast } from "@/components/providers/ToastProvider";
import { buildUpiPaymentUri, generateDynamicUpiQrDataUrl } from "@/lib/payments/upi";

type DynamicUpiQrProps = {
  orderId?: string;
  upiId: string;
  amount: number;
  orderNumber: string;
  payeeName?: string;
  staticQrPath?: string | null;
  onAppLaunched?: () => void;
};

export type PaymentMethodOption = "APPS" | "QR" | "UPI_ID";

export default function DynamicUpiQr({
  orderId,
  upiId,
  amount,
  orderNumber,
  payeeName = "Fashion Cart Premium Outlet",
  staticQrPath,
  onAppLaunched,
}: DynamicUpiQrProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodOption>("APPS");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrSubTab, setQrSubTab] = useState<"DYNAMIC" | "STATIC">("DYNAMIC");
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);
  const { success } = useToast();

  const callbackUrl = typeof window !== "undefined"
    ? `${window.location.origin}/checkout/${orderId || orderNumber}/payment?paid=true&from=upi_app`
    : undefined;

  const upiUri = buildUpiPaymentUri({
    upiId,
    payeeName,
    amount,
    orderNumber,
    callbackUrl,
  });

  // Detect Mobile/Tablet vs Desktop
  useEffect(() => {
    if (typeof window !== "undefined") {
      const ua = navigator.userAgent || navigator.vendor || "";
      const isMobile = /android|iphone|ipad|ipod|mobile|tablet/i.test(ua) || window.innerWidth < 768;
      setIsMobileOrTablet(isMobile);
      // Default to QR on laptop/desktop, APPS on mobile
      if (!isMobile) {
        setSelectedMethod("QR");
      }
    }
  }, []);

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

  function copyText(text: string, type: "UPI" | "AMOUNT", label: string) {
    navigator.clipboard.writeText(text);
    if (type === "UPI") {
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    } else {
      setCopiedAmount(true);
      setTimeout(() => setCopiedAmount(false), 2000);
    }
    success(`${label} Copied!`, text);
  }

  const handleAppLaunch = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("fc_app_payment_initiated", "true");
    }
    onAppLaunched?.();
  };

  return (
    <div className="space-y-5">
      
      {/* 1. Clean Dropdown List of Payment Method */}
      <div className="space-y-1.5 text-left">
        <label htmlFor="payment-method-select" className="block text-xs font-black uppercase tracking-wider text-[#141416] dark:text-white">
          Choose Payment Method:
        </label>
        
        <div className="relative">
          <select
            id="payment-method-select"
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value as PaymentMethodOption)}
            className="w-full appearance-none px-4 py-3.5 pr-10 rounded-2xl border border-[#D9D0C5] dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs sm:text-sm font-bold text-[#141416] dark:text-white outline-none focus:border-[#C59B27] focus:ring-2 focus:ring-[#C59B27]/20 shadow-xs cursor-pointer transition-all"
          >
            <option value="APPS">⚡ 1-Tap Mobile UPI Apps (Google Pay, PhonePe, Paytm, BHIM, CRED)</option>
            <option value="QR">📲 Scan Dynamic UPI QR Code (Auto-Locked Amount: {formatINR(amount)})</option>
            <option value="UPI_ID">🆔 Pay to Verified Merchant UPI ID / VPA ({upiId})</option>
          </select>

          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#787C87]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
      </div>

      {/* 2. Active Payment Content */}

      {/* --- CASE A: 1-TAP UPI APPS (MOBILE) OR AUTO-QR (LAPTOP) --- */}
      {selectedMethod === "APPS" && (
        <div className="animate-in fade-in zoom-in-95 duration-200 space-y-4">
          {isMobileOrTablet ? (
            <div className="p-4 sm:p-5 rounded-3xl border border-[#E7DFD5] bg-white dark:bg-neutral-800 shadow-xs space-y-3.5 text-left">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-amber-500 text-sm">⚡</span>
                  <span className="text-xs font-black uppercase tracking-wider text-[#141416] dark:text-white">
                    Tap to Launch Your App & Pay
                  </span>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  Auto-Locked {formatINR(amount)}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* Google Pay */}
                <a
                  href={upiUri}
                  onClick={handleAppLaunch}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl border border-[#E7DFD5] bg-[#FAF8F5] dark:bg-neutral-900 hover:border-[#4285F4] hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all text-center group cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-white dark:bg-neutral-800 flex items-center justify-center font-black text-[#4285F4] text-sm shadow-xs mb-1.5 group-hover:scale-105 transition-transform">
                    G
                  </div>
                  <p className="text-[11px] font-extrabold text-[#141416] dark:text-white group-hover:text-[#4285F4] transition-colors">Google Pay</p>
                  <span className="text-[9px] font-bold text-[#4285F4]">Pay Now →</span>
                </a>

                {/* PhonePe */}
                <a
                  href={upiUri}
                  onClick={handleAppLaunch}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl border border-[#E7DFD5] bg-[#FAF8F5] dark:bg-neutral-900 hover:border-[#5F259F] hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all text-center group cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#5F259F] flex items-center justify-center font-black text-white text-sm shadow-xs mb-1.5 group-hover:scale-105 transition-transform">
                    P
                  </div>
                  <p className="text-[11px] font-extrabold text-[#141416] dark:text-white group-hover:text-[#5F259F] transition-colors">PhonePe</p>
                  <span className="text-[9px] font-bold text-[#5F259F]">Pay Now →</span>
                </a>

                {/* Paytm */}
                <a
                  href={upiUri}
                  onClick={handleAppLaunch}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl border border-[#E7DFD5] bg-[#FAF8F5] dark:bg-neutral-900 hover:border-[#00BAF2] hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all text-center group cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#00BAF2] flex items-center justify-center font-black text-white text-sm shadow-xs mb-1.5 group-hover:scale-105 transition-transform">
                    ₹
                  </div>
                  <p className="text-[11px] font-extrabold text-[#141416] dark:text-white group-hover:text-[#00BAF2] transition-colors">Paytm UPI</p>
                  <span className="text-[9px] font-bold text-[#00BAF2]">Pay Now →</span>
                </a>

                {/* BHIM / CRED */}
                <a
                  href={upiUri}
                  onClick={handleAppLaunch}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl border border-[#E7DFD5] bg-[#FAF8F5] dark:bg-neutral-900 hover:border-[#C59B27] hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all text-center group cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#141416] flex items-center justify-center font-black text-[#C59B27] text-sm shadow-xs mb-1.5 group-hover:scale-105 transition-transform">
                    ⚡
                  </div>
                  <p className="text-[11px] font-extrabold text-[#141416] dark:text-white group-hover:text-[#C59B27] transition-colors">BHIM / Any UPI</p>
                  <span className="text-[9px] font-bold text-[#C59B27]">Pay Now →</span>
                </a>
              </div>
            </div>
          ) : (
            /* If on Laptop/Desktop, render the QR code directly with friendly headline */
            <div className="p-5 sm:p-6 rounded-3xl border border-[#E7DFD5] bg-white dark:bg-neutral-800 shadow-xs space-y-4 text-center">
              <div className="text-left space-y-1">
                <span className="text-xs font-black uppercase tracking-wider text-[#141416] dark:text-white flex items-center gap-1.5">
                  <span>📲</span> Scan with Google Pay, PhonePe, or Paytm on Your Phone
                </span>
                <p className="text-[11px] text-[#787C87]">
                  Open any UPI app on your phone, scan this QR code, and enter your UPI PIN.
                </p>
              </div>

              {/* Framed QR Code */}
              <div className="flex flex-col items-center justify-center pt-1">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-[#C59B27]/20 rounded-[30px] blur-xs" />
                  
                  <div
                    className="relative w-60 h-60 sm:w-68 sm:h-68 rounded-[28px] border-2 p-4 bg-white shadow-xl flex flex-col items-center justify-center"
                    style={{ borderColor: "#C59B27" }}
                  >
                    {qrDataUrl && !loading ? (
                      <div className="relative w-full h-full">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={qrDataUrl}
                          alt={`NPCI Dynamic UPI QR Code for ${formatINR(amount)}`}
                          className="w-full h-full object-contain"
                        />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="bg-white p-1 rounded-xl shadow-lg border border-[#C59B27]/60 flex items-center justify-center">
                            <div className="px-1.5 py-0.5 rounded-lg bg-[#141416] text-[#C59B27] font-black text-xs">
                              ₹
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-[#787C87] space-y-3">
                        <div className="w-8 h-8 border-3 border-[#C59B27] border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs font-bold tracking-wider uppercase text-[#141416]">Encoding Dynamic QR…</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3.5 inline-flex items-center gap-2 px-4 py-1 rounded-full text-xs font-bold bg-[#FAF6EE] text-[#8E6C0C] border border-[#E7D6A8]">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span>
                    Amount locked: <strong className="text-[#141416] font-black">{formatINR(amount)}</strong>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- CASE B: SCAN DYNAMIC QR CODE --- */}
      {selectedMethod === "QR" && (
        <div className="p-5 sm:p-6 rounded-3xl border border-[#E7DFD5] bg-white dark:bg-neutral-800 shadow-xs space-y-4 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between text-left">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-[#141416] dark:text-white flex items-center gap-1.5">
                <span>📲</span> Scan & Authorize via Any UPI App
              </span>
              <p className="text-[11px] text-[#787C87] mt-0.5">
                Scan with Google Pay, PhonePe, Paytm, BHIM, CRED, or your Mobile Banking App.
              </p>
            </div>

            {staticQrPath && (
              <div className="flex p-0.5 rounded-xl bg-[#F0EBE4] dark:bg-neutral-700/80 border border-[#E2D8CC] shadow-inner text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setQrSubTab("DYNAMIC")}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    qrSubTab === "DYNAMIC" ? "bg-[#141416] text-white" : "text-[#787C87]"
                  }`}
                >
                  Dynamic
                </button>
                <button
                  type="button"
                  onClick={() => setQrSubTab("STATIC")}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    qrSubTab === "STATIC" ? "bg-[#141416] text-white" : "text-[#787C87]"
                  }`}
                >
                  Store QR
                </button>
              </div>
            )}
          </div>

          {/* Framed QR Code */}
          <div className="flex flex-col items-center justify-center pt-1">
            <div className="relative group">
              <div className="absolute -inset-1 bg-[#C59B27]/20 rounded-[30px] blur-xs" />
              
              <div
                className="relative w-60 h-60 sm:w-68 sm:h-68 rounded-[28px] border-2 p-4 bg-white shadow-xl flex flex-col items-center justify-center"
                style={{ borderColor: "#C59B27" }}
              >
                {/* Corner Ornaments */}
                <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-[#C59B27]" />
                <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-[#C59B27]" />
                <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-[#C59B27]" />
                <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-[#C59B27]" />

                {qrSubTab === "DYNAMIC" ? (
                  qrDataUrl && !loading ? (
                    <div className="relative w-full h-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={qrDataUrl}
                        alt={`NPCI Dynamic UPI QR Code for ${formatINR(amount)}`}
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="bg-white p-1 rounded-xl shadow-lg border border-[#C59B27]/60 flex items-center justify-center">
                          <div className="px-1.5 py-0.5 rounded-lg bg-[#141416] text-[#C59B27] font-black text-xs">
                            ₹
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-[#787C87] space-y-3">
                      <div className="w-8 h-8 border-3 border-[#C59B27] border-t-transparent rounded-full animate-spin" />
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

            {qrSubTab === "DYNAMIC" && (
              <div className="mt-3.5 inline-flex items-center gap-2 px-4 py-1 rounded-full text-xs font-bold bg-[#FAF6EE] text-[#8E6C0C] border border-[#E7D6A8]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>
                  Amount locked: <strong className="text-[#141416] font-black">{formatINR(amount)}</strong>
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- CASE C: PAY TO UPI ID / VPA --- */}
      {selectedMethod === "UPI_ID" && (
        <div className="p-5 sm:p-6 rounded-3xl border border-[#E7DFD5] bg-white dark:bg-neutral-800 shadow-sm space-y-4 text-left animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-[#141416] dark:text-white">
              🆔 Pay to Verified Merchant UPI ID
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Verified VPA
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF8F5] dark:bg-neutral-900 border border-[#E7DFD5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#787C87]">Merchant UPI ID / VPA:</p>
              <p className="font-mono text-base sm:text-lg font-black text-[#141416] dark:text-white tracking-wide mt-0.5">{upiId}</p>
            </div>
            <button
              type="button"
              onClick={() => copyText(upiId, "UPI", "UPI ID")}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs ${
                copiedUpi ? "bg-emerald-600 text-white" : "bg-[#141416] text-[#C59B27] hover:bg-[#25262B]"
              }`}
            >
              {copiedUpi ? "✓ UPI ID Copied" : "Copy UPI ID"}
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF8F5] dark:bg-neutral-900 border border-[#E7DFD5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#787C87]">Exact Amount to Enter:</p>
              <p className="font-mono text-lg font-black text-[#C59B27] tracking-tight mt-0.5">{formatINR(amount)}</p>
            </div>
            <button
              type="button"
              onClick={() => copyText(amount.toString(), "AMOUNT", "Payable Amount")}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-2xs ${
                copiedAmount
                  ? "bg-emerald-600 border-emerald-600 text-white"
                  : "bg-white dark:bg-neutral-800 border-[#D9D0C5] text-[#141416] dark:text-white hover:border-[#C59B27]"
              }`}
            >
              {copiedAmount ? "✓ Amount Copied" : "Copy Amount"}
            </button>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAF6EE] border border-[#E7D6A8] space-y-1 text-xs text-[#5A5E69]">
            <p className="font-bold text-[#141416]">💡 Simple 3-Step Guide:</p>
            <ol className="list-decimal list-inside space-y-1 text-[11px]">
              <li>Open any UPI app ➔ Select <strong>&quot;Pay to UPI ID&quot;</strong>.</li>
              <li>Paste <strong>{upiId}</strong> and enter <strong>{formatINR(amount)}</strong>.</li>
              <li>Complete payment with your UPI PIN & attach the screenshot below.</li>
            </ol>
          </div>
        </div>
      )}

      {/* 3. Merchant UPI ID Quick Bar for Reference */}
      <div
        className="w-full flex items-center justify-between p-3 rounded-2xl border bg-[#FAF8F5] dark:bg-neutral-900 shadow-2xs"
        style={{ borderColor: "#E7DFD5" }}
      >
        <div className="text-left pl-1 min-w-0 pr-2">
          <p className="text-[9px] text-[#787C87] uppercase tracking-wider font-extrabold">Shop UPI ID</p>
          <p className="font-mono font-black text-xs text-[#141416] dark:text-white truncate tracking-wide">{upiId}</p>
        </div>
        
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => copyText(amount.toString(), "AMOUNT", "Payable Amount")}
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
            onClick={() => copyText(upiId, "UPI", "UPI ID")}
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
  );
}
