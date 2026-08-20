"use client";

import { useEffect, useState, useRef } from "react";
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

export type PaymentMethodOption = "QR" | "APPS" | "UPI_ID";

const PAYMENT_METHODS: { id: PaymentMethodOption; icon: string; label: string; subtitle: string }[] = [
  {
    id: "QR",
    icon: "📲",
    label: "Scan QR Code",
    subtitle: "Instant scan with any UPI app",
  },
  {
    id: "APPS",
    icon: "⚡",
    label: "UPI Apps",
    subtitle: "Google Pay, PhonePe, Paytm, CRED",
  },
  {
    id: "UPI_ID",
    icon: "🆔",
    label: "UPI ID / VPA",
    subtitle: "Direct merchant transfer",
  },
];

export default function DynamicUpiQr({
  orderId,
  upiId,
  amount,
  orderNumber,
  payeeName = "Fashion Cart",
  staticQrPath,
  onAppLaunched,
}: DynamicUpiQrProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodOption>("QR");
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrSubTab, setQrSubTab] = useState<"DYNAMIC" | "STATIC">("DYNAMIC");
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const { success } = useToast();

  const upiUri = buildUpiPaymentUri({
    upiId,
    payeeName,
    amount,
    orderNumber,
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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

  const getAppUri = (app: string) => {
    let scheme: "generic" | "gpay" | "phonepe" | "paytm" | "bhim" = "generic";
    if (app === "PhonePe") scheme = "phonepe";
    else if (app === "Paytm") scheme = "paytm";
    return buildUpiPaymentUri({ upiId, payeeName, amount, orderNumber, appScheme: scheme });
  };

  const handleAppClick = (appName: string) => {
    setSelectedApp(appName);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("fc_app_payment_initiated", "true");
      // If on mobile, launch the UPI protocol handler
      const isMobile = /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent || "");
      if (isMobile) {
        const targetUri = getAppUri(appName);
        window.location.href = targetUri;
      }
    }
    onAppLaunched?.();
  };

  const activeMethodObj = PAYMENT_METHODS.find((m) => m.id === selectedMethod) || PAYMENT_METHODS[0];

  return (
    <div className="space-y-5">
      
      {/* 1. Custom Luxury Payment Method Dropdown */}
      <div className="space-y-1.5 text-left" ref={dropdownRef}>
        <span className="block text-[11px] font-black uppercase tracking-wider text-[#141416] dark:text-white">
          Payment Method
        </span>

        <div className="relative">
          {/* Main Dropdown Trigger Button */}
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border border-[#D9D0C5] dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-xs hover:border-[#C59B27] transition-all cursor-pointer text-left"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-xl shrink-0">{activeMethodObj.icon}</span>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-extrabold text-[#141416] dark:text-white">
                  {activeMethodObj.label}
                </p>
                <p className="text-[10px] sm:text-[11px] text-[#787C87] truncate">
                  {activeMethodObj.subtitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-bold text-[#C59B27] bg-[#FAF6EE] dark:bg-neutral-900 px-2 py-0.5 rounded-lg border border-[#E7D6A8]/50">
                Change
              </span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`text-[#787C87] transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </button>

          {/* Luxury Dropdown Options Menu */}
          {dropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 z-30 p-2 rounded-2xl border border-[#E2D8CC] dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-2xl space-y-1 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md">
              {PAYMENT_METHODS.map((method) => {
                const isSelected = method.id === selectedMethod;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => {
                      setSelectedMethod(method.id);
                      setDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer text-left ${
                      isSelected
                        ? "bg-[#141416] text-[#C59B27] shadow-sm"
                        : "hover:bg-[#FAF8F5] dark:hover:bg-neutral-700/60 text-[#141416] dark:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{method.icon}</span>
                      <div>
                        <p className={`text-xs font-bold ${isSelected ? "text-[#C59B27]" : "text-[#141416] dark:text-white"}`}>
                          {method.label}
                        </p>
                        <p className={`text-[10px] ${isSelected ? "text-neutral-300" : "text-[#787C87]"}`}>
                          {method.subtitle}
                        </p>
                      </div>
                    </div>

                    {isSelected && (
                      <span className="text-xs font-black text-[#C59B27]">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 2. Active Payment Content */}

      {/* --- OPTION 1: SCAN QR CODE --- */}
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

      {/* --- OPTION 2: UPI APPS (WITH INSTANT APP SELECTION & QR CODE ON LAPTOP / MOBILE) --- */}
      {selectedMethod === "APPS" && (
        <div className="p-4 sm:p-6 rounded-3xl border border-[#E7DFD5] bg-white dark:bg-neutral-800 shadow-xs space-y-5 text-left animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-amber-500 text-sm">⚡</span>
              <span className="text-xs font-black uppercase tracking-wider text-[#141416] dark:text-white">
                Select Your UPI App:
              </span>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              Locked {formatINR(amount)}
            </span>
          </div>

          {/* 4 App Selectors */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Google Pay */}
            <button
              type="button"
              onClick={() => handleAppClick("Google Pay")}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer text-center group ${
                selectedApp === "Google Pay"
                  ? "border-[#4285F4] bg-[#4285F4]/10 shadow-md ring-2 ring-[#4285F4]/30"
                  : "border-[#E7DFD5] bg-[#FAF8F5] dark:bg-neutral-900 hover:border-[#4285F4]"
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-white dark:bg-neutral-800 flex items-center justify-center font-black text-[#4285F4] text-sm shadow-xs mb-1.5 group-hover:scale-105 transition-transform">
                G
              </div>
              <p className="text-[11px] font-extrabold text-[#141416] dark:text-white group-hover:text-[#4285F4] transition-colors">Google Pay</p>
              <span className="text-[9px] font-bold text-[#4285F4]">
                {selectedApp === "Google Pay" ? "✓ Showing QR" : "Pay / Show QR →"}
              </span>
            </button>

            {/* PhonePe */}
            <button
              type="button"
              onClick={() => handleAppClick("PhonePe")}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer text-center group ${
                selectedApp === "PhonePe"
                  ? "border-[#5F259F] bg-[#5F259F]/10 shadow-md ring-2 ring-[#5F259F]/30"
                  : "border-[#E7DFD5] bg-[#FAF8F5] dark:bg-neutral-900 hover:border-[#5F259F]"
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-[#5F259F] flex items-center justify-center font-black text-white text-sm shadow-xs mb-1.5 group-hover:scale-105 transition-transform">
                P
              </div>
              <p className="text-[11px] font-extrabold text-[#141416] dark:text-white group-hover:text-[#5F259F] transition-colors">PhonePe</p>
              <span className="text-[9px] font-bold text-[#5F259F]">
                {selectedApp === "PhonePe" ? "✓ Showing QR" : "Pay / Show QR →"}
              </span>
            </button>

            {/* Paytm */}
            <button
              type="button"
              onClick={() => handleAppClick("Paytm")}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer text-center group ${
                selectedApp === "Paytm"
                  ? "border-[#00BAF2] bg-[#00BAF2]/10 shadow-md ring-2 ring-[#00BAF2]/30"
                  : "border-[#E7DFD5] bg-[#FAF8F5] dark:bg-neutral-900 hover:border-[#00BAF2]"
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-[#00BAF2] flex items-center justify-center font-black text-white text-sm shadow-xs mb-1.5 group-hover:scale-105 transition-transform">
                ₹
              </div>
              <p className="text-[11px] font-extrabold text-[#141416] dark:text-white group-hover:text-[#00BAF2] transition-colors">Paytm</p>
              <span className="text-[9px] font-bold text-[#00BAF2]">
                {selectedApp === "Paytm" ? "✓ Showing QR" : "Pay / Show QR →"}
              </span>
            </button>

            {/* BHIM / CRED */}
            <button
              type="button"
              onClick={() => handleAppClick("BHIM / CRED")}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer text-center group ${
                selectedApp === "BHIM / CRED"
                  ? "border-[#C59B27] bg-[#C59B27]/10 shadow-md ring-2 ring-[#C59B27]/30"
                  : "border-[#E7DFD5] bg-[#FAF8F5] dark:bg-neutral-900 hover:border-[#C59B27]"
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-[#141416] flex items-center justify-center font-black text-[#C59B27] text-sm shadow-xs mb-1.5 group-hover:scale-105 transition-transform">
                ⚡
              </div>
              <p className="text-[11px] font-extrabold text-[#141416] dark:text-white group-hover:text-[#C59B27] transition-colors">BHIM / CRED</p>
              <span className="text-[9px] font-bold text-[#C59B27]">
                {selectedApp === "BHIM / CRED" ? "✓ Showing QR" : "Pay / Show QR →"}
              </span>
            </button>
          </div>

          {/* Dynamic QR Display - Revealed after clicking an app */}
          {selectedApp && (
            <div className="p-4 rounded-2xl bg-[#FAF8F5] dark:bg-neutral-900 border border-[#E7DFD5] text-center space-y-3 animate-in fade-in zoom-in-95 duration-200">
              <div className="space-y-0.5">
                <p className="text-xs font-black text-[#141416] dark:text-white">
                  📲 Pay via {selectedApp}
                </p>
                <p className="text-[10px] text-[#787C87]">
                  Verified Receiver: <strong className="text-emerald-700 dark:text-emerald-400">{payeeName || "Bablu Kumar"}</strong> ({upiId})
                </p>
              </div>

              <div className="flex flex-col items-center justify-center">
                <div
                  className="w-48 h-48 sm:w-56 sm:h-56 rounded-2xl border-2 p-3 bg-white shadow-lg flex flex-col items-center justify-center relative"
                  style={{ borderColor: "#C59B27" }}
                >
                  {qrDataUrl && !loading ? (
                    <div className="relative w-full h-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={qrDataUrl}
                        alt={`UPI QR Code for ${formatINR(amount)}`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-7 h-7 border-2 border-[#C59B27] border-t-transparent rounded-full animate-spin" />
                  )}
                </div>

                <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-[#FAF6EE] text-[#8E6C0C] border border-[#E7D6A8]">
                    <span>Pre-filled & locked: <strong>{formatINR(amount)}</strong></span>
                  </div>

                  <a
                    href={getAppUri(selectedApp)}
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        sessionStorage.setItem("fc_app_payment_initiated", "true");
                      }
                      onAppLaunched?.();
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[10px] font-bold bg-[#141416] text-[#C59B27] hover:bg-[#25262B] transition-all shadow-xs cursor-pointer"
                  >
                    <span>🚀 Launch {selectedApp} →</span>
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- OPTION 3: UPI ID / VPA --- */}
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

          {/* Direct Mobile Number Search Option */}
          <div className="p-4 rounded-2xl bg-[#FAF8F5] dark:bg-neutral-900 border border-[#E7DFD5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#787C87]">📱 Pay via Mobile Number:</p>
              <p className="font-mono text-base sm:text-lg font-black text-[#141416] dark:text-white tracking-wide mt-0.5">9771039201</p>
              <p className="text-[10px] text-[#787C87]">Verified: Bablu Kumar (Linked on BHIM / UPI)</p>
            </div>
            <button
              type="button"
              onClick={() => copyText("9771039201", "AMOUNT", "Mobile Number")}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#141416] text-[#C59B27] hover:bg-[#25262B] transition-all cursor-pointer shadow-xs"
            >
              Copy Mobile No
            </button>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAF6EE] border border-[#E7D6A8] space-y-1 text-xs text-[#5A5E69]">
            <p className="font-bold text-[#141416]">💡 Avoid Bank Limits &amp; Intent Errors:</p>
            <ol className="list-decimal list-inside space-y-1 text-[11px]">
              <li>Scan the <strong>Amount-Locked QR Code</strong> with your phone app, OR</li>
              <li>Open Google Pay / PhonePe / Paytm ➔ Enter <strong>9771039201</strong> (Bablu Kumar) ➔ Pay <strong>{formatINR(amount)}</strong>.</li>
              <li>Attach your transaction screenshot below to confirm your order.</li>
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
