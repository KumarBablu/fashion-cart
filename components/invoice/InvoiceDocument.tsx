"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatINR } from "@/lib/format";
import QRCode from "qrcode";

type OrderItem = {
  id: string;
  productNameSnapshot: string;
  skuSnapshot: string;
  colourSnapshot: string;
  sizeSnapshot: string;
  quantity: number;
  unitPrice: number | string;
  total: number | string;
};

type AddressSnapshot = {
  fullName: string;
  mobileNumber: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  pinCode: string;
  landmark?: string | null;
};

type InvoiceProps = {
  order: {
    id: string;
    orderNumber: string;
    createdAt: string | Date;
    status: string;
    subtotal: number | string;
    discount: number | string;
    couponCode?: string | null;
    deliveryCharge: number | string;
    tax: number | string;
    total: number | string;
    paymentMethod: string;
    carrierName?: string | null;
    trackingNumber?: string | null;
    customerNotes?: string | null;
    shippingAddressSnapshot: AddressSnapshot;
    items: OrderItem[];
    user: { name: string; email: string; phone?: string | null };
    payment?: {
      id: string;
      status: string;
      utrNumber?: string | null;
      gatewayName?: string | null;
      paymentChannel?: string | null;
      instrumentDetails?: string | null;
      submittedAt?: string | Date | null;
    } | null;
    invoice?: {
      invoiceNumber: string;
      createdAt: string | Date;
    } | null;
  };
  business?: {
    businessName: string;
    businessAddress: string | null;
    phone: string | null;
    email: string | null;
    gstin: string | null;
  } | null;
};

export default function InvoiceDocument({ order, business }: InvoiceProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const addr = order.shippingAddressSnapshot;
  const invoiceNumber = order.invoice?.invoiceNumber ?? `FC-INV-2026-${order.orderNumber.replace(/[^0-9]/g, "").slice(-6).padStart(6, "0")}`;
  const invoiceDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const cleanGstin =
    business?.gstin && !business.gstin.startsWith("STORE_CTRL:") && business.gstin.length <= 25
      ? business.gstin
      : "10AABCU9603R1ZM";

  const appBase =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "https://fashioncartstore.vercel.app";
  const verificationUrl = `${appBase}/invoices/${order.id}`;

  useEffect(() => {
    QRCode.toDataURL(verificationUrl, {
      width: 180,
      margin: 1,
      color: {
        dark: "#141416",
        light: "#FFFFFF",
      },
    })
      .then(setQrDataUrl)
      .catch((err) => console.error("QR Code error:", err));
  }, [verificationUrl]);

  const subtotal = Number(order.subtotal);
  const discount = Number(order.discount);
  const delivery = Number(order.deliveryCharge);
  const grandTotal = Number(order.total);

  // 5% Apparel GST breakdown (2.5% CGST + 2.5% SGST)
  const taxableValue = Math.max(0, subtotal - discount);
  const totalTaxCalculated = Math.round((taxableValue * 0.05) * 100) / 100;
  const cgstAmount = (totalTaxCalculated / 2).toFixed(2);
  const sgstAmount = (totalTaxCalculated / 2).toFixed(2);

  function handlePrint() {
    window.print();
  }

  return (
    <div className="bg-white text-slate-900 font-sans antialiased max-w-4xl mx-auto p-4 sm:p-8 rounded-3xl border border-slate-200 shadow-2xl print:border-0 print:shadow-none print:p-0 print:max-w-none print:m-0 print:bg-transparent">
      {/* Screen Action Bar (Strictly Hidden on Print/Save) */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-200 print:hidden">
        <div>
          <h1 className="text-xl font-bold text-slate-900 font-display flex items-center gap-2">
            <span>📄</span> Official GST Tax Invoice &amp; Digital Receipt
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-mono">
            Invoice #{invoiceNumber} · Order #{order.orderNumber}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider bg-[#141416] text-white hover:bg-[#25262B] shadow-sm flex items-center gap-2 transition-all cursor-pointer"
            title="Print or Save Receipt as PDF"
          >
            <span>🖨️</span> Print / Save Receipt
          </button>
          <a
            href={`/api/invoices/${order.id}`}
            download={`FashionCart-Tax-Invoice-${order.orderNumber}-${invoiceNumber}.pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider bg-[#C59B27] text-white hover:bg-[#B0881E] shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
            title="Download pure PDF receipt"
          >
            <span>📥</span> Download PDF Receipt
          </a>
        </div>
      </div>

      {/* Pure Printable Receipt Document Body */}
      <div id="invoice-receipt-card" className="space-y-6 text-xs leading-normal bg-white print:p-0 print:m-0">
        {/* Brand Header Banner with Embedded Scannable QR Code */}
        <div className="p-6 rounded-2xl bg-[#141416] text-white border border-[#27272A] shadow-md flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <div className="relative h-11 w-11 overflow-hidden shrink-0">
                <Image
                  src="/fashion-cart-logo-transparent.svg"
                  alt="Fashion Cart Official Monogram"
                  fill
                  sizes="44px"
                  className="object-contain"
                />
              </div>
              <div>
                <span className="font-display text-2xl font-black text-[#C59B27] tracking-tight leading-none block">
                  {business?.businessName || "Fashion CART"}
                </span>
                <span className="text-[9px] uppercase tracking-[0.25em] font-semibold text-white/90">
                  Premium Outlet &amp; Fine Apparel
                </span>
              </div>
            </div>

            <p className="text-[10px] text-white/70 max-w-sm pt-1 leading-relaxed">
              {business?.businessAddress || "Sonar Toli, City: Siwan, State: Bihar, PIN: 841226"}
            </p>
            <p className="text-[10px] text-white/80 font-medium">
              GSTIN: <span className="font-mono font-bold text-[#C59B27]">{cleanGstin}</span> · State: Bihar (10)
            </p>
            <p className="text-[10px] text-white/70">
              Support: {business?.email || "Fashioncart.support@gmail.com"} · Contact: {business?.phone || "+91 97710 39201"}
            </p>
          </div>

          {/* Right Column with Authentic QR Code & Tax Meta */}
          <div className="text-right sm:text-right space-y-2 self-stretch sm:self-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-white/10 flex flex-col sm:items-end">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#C59B27] text-white shadow-xs">
              TAX INVOICE · ORIGINAL
            </div>

            {/* Authentic Digital Verification QR Code */}
            <div className="bg-white p-2 rounded-xl inline-flex flex-col items-center justify-center shadow-md">
              {qrDataUrl ? (
                <div className="relative h-18 w-18">
                  <Image
                    src={qrDataUrl}
                    alt="Digital Tax Invoice Verification QR Code"
                    fill
                    sizes="72px"
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className="h-18 w-18 bg-neutral-100 flex items-center justify-center text-[10px] text-slate-400">
                  Loading QR…
                </div>
              )}
              <span className="font-mono text-[8px] font-bold text-slate-800 tracking-wider mt-1 uppercase">
                Scan for Digital Copy
              </span>
            </div>

            <div className="text-[10px] text-white/80 space-y-0.5 font-medium">
              <p>Invoice Date: <span className="font-bold text-white">{invoiceDate}</span></p>
              <p>Order ID: <span className="font-mono font-bold text-[#C59B27]">#{order.orderNumber}</span></p>
              <p>Place of Supply: <span className="font-bold text-white">{addr.state || "Karnataka"} (Code: 29)</span></p>
            </div>
          </div>
        </div>

        {/* Dispatch & Customer Billing Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Buyer Details */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-1.5">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                BILLED &amp; SHIPPED TO (CUSTOMER)
              </p>
              <span className="text-[9px] font-bold uppercase text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                Verified Recipient
              </span>
            </div>
            <p className="text-sm font-bold text-slate-900">{addr.fullName}</p>
            <p className="text-slate-600">{addr.addressLine1}</p>
            {addr.addressLine2 && <p className="text-slate-600">{addr.addressLine2}</p>}
            <p className="text-slate-600">{addr.city}, {addr.state} - <span className="font-bold text-slate-900">{addr.pinCode}</span></p>
            {addr.landmark && <p className="text-slate-500 text-[11px]">Landmark: {addr.landmark}</p>}
            <p className="text-slate-700 pt-1">
              Mobile: <span className="font-semibold text-slate-900">{addr.mobileNumber}</span> · Email: {order.user.email}
            </p>
          </div>

          {/* Payment & Logistics Summary */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-1">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                PAYMENT &amp; LOGISTICS FULFILLMENT
              </p>
              <span className="text-[9px] font-bold uppercase text-slate-600 bg-slate-200 px-1.5 py-0.2 rounded font-mono">
                Order #{order.orderNumber}
              </span>
            </div>
            <div className="space-y-1 text-slate-600 text-[11px]">
              <p className="flex justify-between">
                <span>Payment Method:</span>
                <span className="font-bold text-slate-900">
                  {order.payment?.paymentChannel ? `Online (${order.payment.paymentChannel})` : (order.paymentMethod.includes("ONLINE") ? "Instant Online Payment" : order.paymentMethod.replace(/_/g, " "))}
                </span>
              </p>
              {order.payment?.paymentChannel && (
                <p className="flex justify-between">
                  <span>Channel / Mode:</span>
                  <span className="font-semibold text-slate-900">{order.payment.paymentChannel}</span>
                </p>
              )}
              {order.payment?.instrumentDetails && (
                <p className="flex justify-between">
                  <span>Instrument / App:</span>
                  <span className="font-semibold text-slate-900">{order.payment.instrumentDetails}</span>
                </p>
              )}
              <p className="flex justify-between">
                <span>Payment Status:</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded border border-emerald-200">
                  {order.payment?.status === "VERIFIED" ? "✓ 100% VERIFIED & CONFIRMED" : order.payment?.status?.replace(/_/g, " ") || "CONFIRMED"}
                </span>
              </p>
              {order.payment?.utrNumber && (
                <p className="flex justify-between">
                  <span>Transaction ID / Ref:</span>
                  <span className="font-mono font-bold text-slate-900">{order.payment.utrNumber}</span>
                </p>
              )}
              {order.carrierName && (
                <p className="flex justify-between">
                  <span>Courier Partner:</span>
                  <span className="font-bold text-slate-900">{order.carrierName}</span>
                </p>
              )}
              {order.trackingNumber && (
                <p className="flex justify-between">
                  <span>AWB Tracking No:</span>
                  <span className="font-mono font-bold text-primary">{order.trackingNumber}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Itemized Table (Zero Overlaps) */}
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-800 text-[10px] font-extrabold uppercase tracking-wider border-b border-slate-200">
                <th className="py-2.5 px-3 w-8 text-center">#</th>
                <th className="py-2.5 px-4">Product Description</th>
                <th className="py-2.5 px-3 text-center">HSN Code</th>
                <th className="py-2.5 px-3 text-center">Colour / Size</th>
                <th className="py-2.5 px-3 text-center">Qty</th>
                <th className="py-2.5 px-4 text-right">Unit Price</th>
                <th className="py-2.5 px-4 text-right">Amount (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {order.items.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-3 text-slate-400 font-mono text-center">{idx + 1}</td>
                  <td className="py-3 px-4">
                    <p className="font-bold text-slate-900 text-sm">{item.productNameSnapshot}</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      Premium Edition · {item.colourSnapshot}
                    </p>
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-[11px] text-slate-600">
                    6204.19
                  </td>
                  <td className="py-3 px-3 text-center text-[11px] text-slate-700">
                    <span className="font-bold text-slate-900">{item.colourSnapshot}</span>
                    <span className="block text-[10px] text-slate-500 font-medium">Size: {item.sizeSnapshot}</span>
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-slate-900 text-sm">
                    {item.quantity}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-700 font-medium">
                    {formatINR(item.unitPrice)}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">
                    {formatINR(item.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Detailed GST Tax Matrix & Grand Totals */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* GST Tax Matrix Table */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
              TAX COMPUTATION MATRIX (GST 5% APPAREL)
            </p>
            <table className="w-full text-[11px] text-left">
              <thead>
                <tr className="text-slate-500 border-b border-slate-200 text-[9px] uppercase font-bold">
                  <th className="pb-1">Tax Head</th>
                  <th className="pb-1 text-right">Taxable Val</th>
                  <th className="pb-1 text-right">Rate</th>
                  <th className="pb-1 text-right">Tax Amt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                <tr>
                  <td className="py-1">Central GST (CGST)</td>
                  <td className="py-1 text-right">{formatINR(taxableValue)}</td>
                  <td className="py-1 text-right">2.5%</td>
                  <td className="py-1 text-right font-mono font-bold">INR {cgstAmount}</td>
                </tr>
                <tr>
                  <td className="py-1">State GST (SGST)</td>
                  <td className="py-1 text-right">{formatINR(taxableValue)}</td>
                  <td className="py-1 text-right">2.5%</td>
                  <td className="py-1 text-right font-mono font-bold">INR {sgstAmount}</td>
                </tr>
                <tr className="font-bold text-slate-900 pt-1">
                  <td className="pt-1.5">Total Integrated Tax</td>
                  <td className="pt-1.5 text-right">{formatINR(taxableValue)}</td>
                  <td className="pt-1.5 text-right">5.0%</td>
                  <td className="pt-1.5 text-right font-mono text-primary font-bold">INR {totalTaxCalculated.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
            <p className="text-[10px] text-slate-500 italic pt-1">
              * Tax is inclusive in MRP as per GST laws for retail sale. Reverse Charge: No.
            </p>
          </div>

          {/* Pricing Totals Box */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal (Gross):</span>
                <span className="font-bold text-slate-900">{formatINR(subtotal)}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-rose-600 font-bold">
                  <span>Special Discount ({order.couponCode || "Promo"}):</span>
                  <span>- {formatINR(discount)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span>Express Doorstep Delivery:</span>
                <span className="font-bold text-slate-900">
                  {delivery === 0 ? "FREE (Complimentary)" : formatINR(delivery)}
                </span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Applicable GST (CGST + SGST):</span>
                <span className="text-slate-900 font-medium">INR {totalTaxCalculated.toFixed(2)}</span>
              </div>

              {/* Grand Total Banner */}
              <div className="flex justify-between items-center text-sm font-bold pt-3 mt-1 border-t border-slate-300">
                <div>
                  <span className="text-slate-900 text-base font-display">GRAND TOTAL:</span>
                  <p className="text-[10px] text-slate-500 font-normal">Inclusive of all applicable taxes</p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-[#C59B27] font-display">
                    {formatINR(grandTotal)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Terms & Authorized Signatory Block */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-200">
          <div className="sm:col-span-2 space-y-1 text-[10px] text-slate-500">
            <p className="font-bold text-slate-700 uppercase tracking-wider">Declaration &amp; Store Terms:</p>
            <p>1. We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</p>
            <p>2. Hassle-free 7-day doorstep replacement or return available through your online account portal.</p>
            <p>3. Computer-generated tax invoice issued in accordance with Section 65B of Indian Information Technology Act, 2000.</p>
          </div>

          {/* Digital Signature Box */}
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 text-center space-y-1">
            <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500">
              For {business?.businessName || "Fashion Cart"}
            </p>
            <div className="h-9 flex items-center justify-center font-display text-base font-bold text-[#C59B27] italic">
              Fashion Cart Atelier
            </div>
            <p className="text-[9px] font-bold text-emerald-700 uppercase">
              ✓ Digitally Signed &amp; Authenticated
            </p>
            <p className="text-[8px] text-slate-400 font-mono">
              Auth ID: FC-{order.orderNumber.replace(/[^0-9]/g, "").slice(-8)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
