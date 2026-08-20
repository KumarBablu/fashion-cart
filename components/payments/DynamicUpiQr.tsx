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

export type PaymentMethodTab = "QR" | "UPI_ID" | "APPS" | "CARD_BANK";

export default function DynamicUpiQr({
  upiId,
  amount,
  orderNumber,
  payeeName = "Fashion Cart Premium Outlet",
  staticQrPath,
}: DynamicUpiQrProps) {
  const [activeMethod, setActiveMethod] = useState<PaymentMethodTab>("QR");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrSubTab, setQrSubTab] = useState<"DYNAMIC" | "STATIC">("DYNAMIC");
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedIfsc, setCopiedIfsc] = useState(false);
  const [copiedBeneficiary, setCopiedBeneficiary] = useState(false);
  const { success } = useToast();

  const upiUri = buildUpiPaymentUri({
    upiId,
    payeeName,
    amount,
    orderNumber,
  });

  // Bank Transfer Details
  const bankDetails = {
    beneficiaryName: "Fashion Cart Luxury Retail Pvt Ltd",
    accountNumber: "926020048192039",
    bankName: "HDFC Bank Ltd",
    ifscCode: "HDFC0001824",
    accountType: "Current Business Account",
    branch: "Central Premium Banking Branch",
  };

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

  function copyText(text: string, type: "UPI" | "AMOUNT" | "ACCOUNT" | "IFSC" | "BENEFICIARY", label: string) {
    navigator.clipboard.writeText(text);
    if (type === "UPI") {
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    } else if (type === "AMOUNT") {
      setCopiedAmount(true);
      setTimeout(() => setCopiedAmount(false), 2000);
    } else if (type === "ACCOUNT") {
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2000);
    } else if (type === "IFSC") {
      setCopiedIfsc(true);
      setTimeout(() => setCopiedIfsc(false), 2000);
    } else if (type === "BENEFICIARY") {
      setCopiedBeneficiary(true);
      setTimeout(() => setCopiedBeneficiary(false), 2000);
    }
    success(`${label} Copied!`, text);
  }

  return (
    <div className="space-y-6">
      
      {/* 1. Master Payment Method Tabs Selector */}
      <div className="space-y-2">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#787C87] text-center">
          Choose Your Preferred Payment Option:
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1.5 rounded-3xl bg-[#F0EBE4] dark:bg-neutral-800/80 border border-[#E2D8CC] dark:border-neutral-700 shadow-inner">
          
          {/* Tab 1: Scan QR */}
          <button
            type="button"
            onClick={() => setActiveMethod("QR")}
            className={`py-2.5 px-3 rounded-2xl text-xs font-extrabold transition-all duration-200 cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
              activeMethod === "QR"
                ? "bg-[#141416] text-[#C59B27] shadow-lg scale-[1.02]"
                : "text-[#6B7280] hover:text-[#141416] dark:hover:text-white"
            }`}
          >
            <span className="text-base">📲</span>
            <span>Scan QR</span>
          </button>

          {/* Tab 2: UPI ID */}
          <button
            type="button"
            onClick={() => setActiveMethod("UPI_ID")}
            className={`py-2.5 px-3 rounded-2xl text-xs font-extrabold transition-all duration-200 cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
              activeMethod === "UPI_ID"
                ? "bg-[#141416] text-[#C59B27] shadow-lg scale-[1.02]"
                : "text-[#6B7280] hover:text-[#141416] dark:hover:text-white"
            }`}
          >
            <span className="text-base">🆔</span>
            <span>UPI ID / VPA</span>
          </button>

          {/* Tab 3: UPI Apps */}
          <button
            type="button"
            onClick={() => setActiveMethod("APPS")}
            className={`py-2.5 px-3 rounded-2xl text-xs font-extrabold transition-all duration-200 cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
              activeMethod === "APPS"
                ? "bg-[#141416] text-[#C59B27] shadow-lg scale-[1.02]"
                : "text-[#6B7280] hover:text-[#141416] dark:hover:text-white"
            }`}
          >
            <span className="text-base">⚡</span>
            <span>UPI Apps</span>
          </button>

          {/* Tab 4: Card / NetBanking / Bank Transfer */}
          <button
            type="button"
            onClick={() => setActiveMethod("CARD_BANK")}
            className={`py-2.5 px-3 rounded-2xl text-xs font-extrabold transition-all duration-200 cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
              activeMethod === "CARD_BANK"
                ? "bg-[#141416] text-[#C59B27] shadow-lg scale-[1.02]"
                : "text-[#6B7280] hover:text-[#141416] dark:hover:text-white"
            }`}
          >
            <span className="text-base">💳</span>
            <span>Card / Bank</span>
          </button>
        </div>
      </div>

      {/* 2. Active Tab Dynamic Panel */}

      {/* --- PANEL 1: SCAN QR CODE --- */}
      {activeMethod === "QR" && (
        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
          {/* Sub-tab if Admin uploaded a static merchant QR */}
          {staticQrPath && (
            <div className="flex p-1 rounded-2xl bg-[#F0EBE4] dark:bg-neutral-800/80 border border-[#E2D8CC] max-w-xs mx-auto shadow-inner">
              <button
                type="button"
                onClick={() => setQrSubTab("DYNAMIC")}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  qrSubTab === "DYNAMIC" ? "bg-[#141416] text-white shadow-xs" : "text-dim"
                }`}
              >
                <span>✨</span>
                <span>Dynamic ({formatINR(amount)})</span>
              </button>
              <button
                type="button"
                onClick={() => setQrSubTab("STATIC")}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  qrSubTab === "STATIC" ? "bg-[#141416] text-white shadow-xs" : "text-dim"
                }`}
              >
                <span>🏛️</span>
                <span>Store QR</span>
              </button>
            </div>
          )}

          {/* Luxury QR Frame */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative group">
              <div className="absolute -inset-1.5 bg-gradient-to-r from-[#C59B27]/30 via-amber-200/20 to-[#C59B27]/30 rounded-[32px] blur-sm opacity-70 group-hover:opacity-100 transition duration-500" />
              
              <div
                className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-[28px] border-2 p-4 bg-white shadow-2xl flex flex-col items-center justify-center"
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

            {/* Live Session Status Indicator */}
            {qrSubTab === "DYNAMIC" && (
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-[#FAF6EE] text-[#8E6C0C] border border-[#E7D6A8] shadow-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>
                  Scans auto-fill & lock: <strong className="text-[#141416] font-black">{formatINR(amount)}</strong>
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- PANEL 2: PAY VIA UPI ID / VPA --- */}
      {activeMethod === "UPI_ID" && (
        <div className="p-5 sm:p-6 rounded-3xl border border-[#E7DFD5] bg-white dark:bg-neutral-800/80 shadow-md space-y-5 text-left animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-[#141416] dark:text-white flex items-center gap-1.5">
              <span>🆔</span> Transfer Directly to Verified Merchant VPA
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Verified UPI
            </span>
          </div>

          {/* Copyable Store UPI Box */}
          <div className="p-4 rounded-2xl bg-[#FAF8F5] dark:bg-neutral-900 border border-[#E7DFD5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#787C87]">Boutique UPI ID / VPA:</p>
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

          {/* Copyable Amount Box */}
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

          {/* Step Guide for UPI ID Payment */}
          <div className="p-3.5 rounded-2xl bg-[#FAF6EE] border border-[#E7D6A8] space-y-1 text-xs text-[#5A5E69]">
            <p className="font-bold text-[#141416]">💡 How to Pay via UPI ID:</p>
            <ol className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed">
              <li>Open any UPI app (GPay, PhonePe, Paytm, BHIM, CRED, Amazon Pay).</li>
              <li>Select <strong>&quot;Pay to UPI ID / Mobile Number&quot;</strong> and paste <strong>{upiId}</strong>.</li>
              <li>Enter exact amount <strong>{formatINR(amount)}</strong> and note <strong>Order #{orderNumber}</strong>.</li>
              <li>Complete payment with your UPI PIN & save the screenshot for verification below.</li>
            </ol>
          </div>
        </div>
      )}

      {/* --- PANEL 3: DIRECT 1-TAP UPI APPS --- */}
      {activeMethod === "APPS" && (
        <div className="p-5 sm:p-6 rounded-3xl border border-[#E7DFD5] bg-white dark:bg-neutral-800/80 shadow-md space-y-4 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="text-center space-y-1">
            <span className="text-xs font-black uppercase tracking-wider text-[#141416] dark:text-white">
              ⚡ Open & Pay Directly in Your Preferred App
            </span>
            <p className="text-[11px] text-[#787C87]">
              Tap any app below to automatically launch with the exact {formatINR(amount)} pre-filled.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto pt-1">
            {/* Google Pay */}
            <a
              href={upiUri}
              className="flex items-center justify-between p-3.5 rounded-2xl border border-[#E7DFD5] bg-white dark:bg-neutral-900 shadow-xs hover:shadow-md hover:border-[#4285F4] hover:-translate-y-0.5 active:scale-95 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#F1F5F9] flex items-center justify-center font-black text-[#4285F4] text-sm shadow-2xs">
                  G
                </div>
                <div>
                  <p className="text-xs font-extrabold text-[#141416] dark:text-white group-hover:text-[#4285F4] transition-colors">Google Pay</p>
                  <p className="text-[10px] text-[#787C87]">Pre-filled ₹{amount}</p>
                </div>
              </div>
              <span className="text-xs font-extrabold text-[#4285F4]">Pay →</span>
            </a>

            {/* PhonePe */}
            <a
              href={upiUri}
              className="flex items-center justify-between p-3.5 rounded-2xl border border-[#E7DFD5] bg-white dark:bg-neutral-900 shadow-xs hover:shadow-md hover:border-[#5F259F] hover:-translate-y-0.5 active:scale-95 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#5F259F] flex items-center justify-center font-black text-white text-sm shadow-2xs">
                  P
                </div>
                <div>
                  <p className="text-xs font-extrabold text-[#141416] dark:text-white group-hover:text-[#5F259F] transition-colors">PhonePe</p>
                  <p className="text-[10px] text-[#787C87]">Pre-filled ₹{amount}</p>
                </div>
              </div>
              <span className="text-xs font-extrabold text-[#5F259F]">Pay →</span>
            </a>

            {/* Paytm */}
            <a
              href={upiUri}
              className="flex items-center justify-between p-3.5 rounded-2xl border border-[#E7DFD5] bg-white dark:bg-neutral-900 shadow-xs hover:shadow-md hover:border-[#00BAF2] hover:-translate-y-0.5 active:scale-95 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#00BAF2] flex items-center justify-center font-black text-white text-sm shadow-2xs">
                  ₹
                </div>
                <div>
                  <p className="text-xs font-extrabold text-[#141416] dark:text-white group-hover:text-[#00BAF2] transition-colors">Paytm UPI</p>
                  <p className="text-[10px] text-[#787C87]">Pre-filled ₹{amount}</p>
                </div>
              </div>
              <span className="text-xs font-extrabold text-[#00BAF2]">Pay →</span>
            </a>

            {/* CRED / BHIM */}
            <a
              href={upiUri}
              className="flex items-center justify-between p-3.5 rounded-2xl border border-[#E7DFD5] bg-white dark:bg-neutral-900 shadow-xs hover:shadow-md hover:border-[#C59B27] hover:-translate-y-0.5 active:scale-95 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#141416] flex items-center justify-center font-black text-[#C59B27] text-sm shadow-2xs">
                  ⚡
                </div>
                <div>
                  <p className="text-xs font-extrabold text-[#141416] dark:text-white group-hover:text-[#C59B27] transition-colors">BHIM / Any UPI</p>
                  <p className="text-[10px] text-[#787C87]">Pre-filled ₹{amount}</p>
                </div>
              </div>
              <span className="text-xs font-extrabold text-[#C59B27]">Pay →</span>
            </a>
          </div>
        </div>
      )}

      {/* --- PANEL 4: CARD / NETBANKING / BANK TRANSFER (IMPS/NEFT) --- */}
      {activeMethod === "CARD_BANK" && (
        <div className="p-5 sm:p-6 rounded-3xl border border-[#E7DFD5] bg-white dark:bg-neutral-800/80 shadow-md space-y-4 text-left animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-[#141416] dark:text-white flex items-center gap-1.5">
              <span>🏛️</span> Direct Bank Wire / IMPS / NEFT / RTGS
            </span>
            <span className="text-[10px] font-bold text-[#C59B27] bg-[#FAF6EE] px-2.5 py-0.5 rounded-full border border-[#E7D6A8]">
              0% Fee
            </span>
          </div>

          <p className="text-[11px] text-[#6B7280]">
            Use your Banking App / NetBanking / Debit Card to transfer directly to our Verified Corporate Bank Account.
          </p>

          <div className="space-y-2.5">
            {/* Beneficiary Name */}
            <div className="p-3 rounded-2xl bg-[#FAF8F5] dark:bg-neutral-900 border border-[#E7DFD5] flex items-center justify-between gap-2">
              <div>
                <p className="text-[9px] font-extrabold uppercase text-[#787C87]">Beneficiary Name</p>
                <p className="text-xs font-bold text-[#141416] dark:text-white">{bankDetails.beneficiaryName}</p>
              </div>
              <button
                type="button"
                onClick={() => copyText(bankDetails.beneficiaryName, "BENEFICIARY", "Beneficiary Name")}
                className="px-2.5 py-1 rounded-lg text-[10px] font-bold border border-[#D9D0C5] hover:border-[#C59B27] transition-all cursor-pointer"
              >
                {copiedBeneficiary ? "✓" : "Copy"}
              </button>
            </div>

            {/* Account Number */}
            <div className="p-3 rounded-2xl bg-[#FAF8F5] dark:bg-neutral-900 border border-[#E7DFD5] flex items-center justify-between gap-2">
              <div>
                <p className="text-[9px] font-extrabold uppercase text-[#787C87]">Current Account Number</p>
                <p className="font-mono text-sm font-black text-[#141416] dark:text-white">{bankDetails.accountNumber}</p>
              </div>
              <button
                type="button"
                onClick={() => copyText(bankDetails.accountNumber, "ACCOUNT", "Account Number")}
                className="px-2.5 py-1 rounded-lg text-[10px] font-bold border border-[#D9D0C5] hover:border-[#C59B27] transition-all cursor-pointer"
              >
                {copiedAccount ? "✓" : "Copy"}
              </button>
            </div>

            {/* IFSC Code & Bank */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-2xl bg-[#FAF8F5] dark:bg-neutral-900 border border-[#E7DFD5] flex items-center justify-between gap-2">
                <div>
                  <p className="text-[9px] font-extrabold uppercase text-[#787C87]">IFSC Code</p>
                  <p className="font-mono text-xs font-black text-[#141416] dark:text-white">{bankDetails.ifscCode}</p>
                </div>
                <button
                  type="button"
                  onClick={() => copyText(bankDetails.ifscCode, "IFSC", "IFSC Code")}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold border border-[#D9D0C5] hover:border-[#C59B27] transition-all cursor-pointer"
                >
                  {copiedIfsc ? "✓" : "Copy"}
                </button>
              </div>

              <div className="p-3 rounded-2xl bg-[#FAF8F5] dark:bg-neutral-900 border border-[#E7DFD5]">
                <p className="text-[9px] font-extrabold uppercase text-[#787C87]">Bank & Type</p>
                <p className="text-xs font-bold text-[#141416] dark:text-white">{bankDetails.bankName} (Current)</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Store UPI Quick Bar for reference */}
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
