"use client";

import Image from "next/image";
import Link from "next/link";
import { formatINR } from "@/lib/format";

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
  const addr = order.shippingAddressSnapshot;
  const invoiceNumber = order.invoice?.invoiceNumber ?? `FC-INV-${order.orderNumber.replace("FC-", "")}`;
  const invoiceDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const subtotal = Number(order.subtotal);
  const discount = Number(order.discount);
  const delivery = Number(order.deliveryCharge);
  const taxTotal = Number(order.tax);
  const grandTotal = Number(order.total);

  // Approximate 9% CGST + 9% SGST breakdown
  const taxableValue = subtotal - discount;
  const cgst = (taxTotal / 2).toFixed(2);
  const sgst = (taxTotal / 2).toFixed(2);

  function handlePrint() {
    window.print();
  }

  return (
    <div className="bg-white text-slate-900 font-sans antialiased max-w-4xl mx-auto p-4 sm:p-8 rounded-3xl border border-slate-200 shadow-xl print:border-0 print:shadow-none print:p-0 print:max-w-none print:m-0">
      {/* Screen Control Bar (Hidden on Print) */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-200 print:hidden">
        <div>
          <h1 className="text-xl font-bold text-slate-900 font-display">Tax Invoice &amp; Official Receipt</h1>
          <p className="text-xs text-slate-500 mt-0.5">Order #{order.orderNumber} · Invoice #{invoiceNumber}</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider bg-[#141416] text-white hover:bg-[#25262B] shadow-sm flex items-center gap-2 transition-all"
          >
            <span>🖨️</span> Print Invoice / Save PDF
          </button>
          <a
            href={`/api/invoices/${order.id}`}
            download={`FashionCart-Tax-Invoice-${order.orderNumber}-${(order.shippingAddressSnapshot?.fullName || order.user.name || "Customer").replace(/[^a-zA-Z0-9]/g, "-").toUpperCase()}.pdf`}
            className="px-4 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider bg-[#C59B27] text-white hover:bg-[#B0881E] shadow-sm flex items-center gap-1.5 transition-all"
          >
            <span>📥</span> Download PDF
          </a>
        </div>
      </div>

      {/* Printable Invoice Container */}
      <div className="space-y-6 text-xs leading-normal">
        {/* Brand Header Banner */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 p-6 rounded-2xl bg-[#141416] text-white print:bg-[#141416] print:text-white">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">✨</span>
              <span className="font-display text-2xl font-bold text-[#C59B27] tracking-wide">
                {business?.businessName || "FASHION CART"}
              </span>
            </div>
            <p className="text-[11px] text-white/80 font-medium tracking-widest uppercase">
              Haute Couture &amp; Designer Apparel
            </p>
            <p className="text-[10px] text-white/70 max-w-sm">
              {business?.businessAddress || "Atelier Logistics Hub, 108 Fashion Avenue, Indiranagar, Bengaluru, Karnataka - 560038"}
            </p>
            <p className="text-[10px] text-white/70">
              GSTIN: <span className="font-mono font-bold text-[#C59B27]">{business?.gstin || "29AAAAA0000A1Z5"}</span> · CIN: U74999KA2024PTC189201
            </p>
          </div>

          <div className="text-right sm:text-right space-y-1 self-stretch sm:self-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-white/20">
            <span className="inline-block px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#C59B27] text-white">
              TAX INVOICE · ORIGINAL
            </span>
            <p className="text-[11px] font-bold text-white mt-1">Invoice: <span className="font-mono">{invoiceNumber}</span></p>
            <p className="text-[10px] text-white/80">Date: {invoiceDate}</p>
            <p className="text-[10px] text-white/80">Order Ref: <span className="font-mono">{order.orderNumber}</span></p>
            <p className="text-[10px] text-white/80">Place of Supply: <span className="font-bold">{addr.state} (State Code: 29)</span></p>
          </div>
        </div>

        {/* Customer Billed & Shipped Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
              BILLED TO / CUSTOMER DETAILS
            </p>
            <p className="text-sm font-bold text-slate-900">{addr.fullName}</p>
            <p className="text-slate-600 mt-0.5">{addr.addressLine1}</p>
            {addr.addressLine2 && <p className="text-slate-600">{addr.addressLine2}</p>}
            <p className="text-slate-600">{addr.city}, {addr.state} - <span className="font-bold">{addr.pinCode}</span></p>
            {addr.landmark && <p className="text-slate-500 text-[11px]">Landmark: {addr.landmark}</p>}
            <p className="text-slate-600 mt-1">Mobile: <span className="font-semibold text-slate-900">{addr.mobileNumber}</span></p>
            <p className="text-slate-600">Email: {order.user.email}</p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
              PAYMENT &amp; DISPATCH SUMMARY
            </p>
            <div className="space-y-1 text-slate-600">
              <p className="flex justify-between">
                <span>Payment Mode:</span>
                <span className="font-bold text-slate-900">{order.paymentMethod.replace(/_/g, " ")}</span>
              </p>
              <p className="flex justify-between">
                <span>Payment Status:</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded">
                  {order.payment?.status === "VERIFIED" ? "✓ 100% VERIFIED" : order.payment?.status?.replace(/_/g, " ") || "PAID"}
                </span>
              </p>
              {order.payment?.utrNumber && (
                <p className="flex justify-between">
                  <span>UTR / Ref No:</span>
                  <span className="font-mono font-bold text-slate-900">{order.payment.utrNumber}</span>
                </p>
              )}
              {order.carrierName && (
                <p className="flex justify-between">
                  <span>Courier / Carrier:</span>
                  <span className="font-semibold text-slate-900">{order.carrierName}</span>
                </p>
              )}
              {order.trackingNumber && (
                <p className="flex justify-between">
                  <span>Tracking AWB:</span>
                  <span className="font-mono font-bold text-slate-900">{order.trackingNumber}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Itemized Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/90 text-slate-800 text-[10px] font-extrabold uppercase tracking-wider border-b border-slate-200">
                <th className="py-2.5 px-3 w-8">#</th>
                <th className="py-2.5 px-3">Item Description</th>
                <th className="py-2.5 px-3 text-center">HSN</th>
                <th className="py-2.5 px-3 text-center">SKU / Variant</th>
                <th className="py-2.5 px-3 text-center">Qty</th>
                <th className="py-2.5 px-3 text-right">Unit Rate</th>
                <th className="py-2.5 px-3 text-right">Total (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {order.items.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 text-slate-400 font-mono">{idx + 1}</td>
                  <td className="py-2.5 px-3">
                    <p className="font-bold text-slate-900">{item.productNameSnapshot}</p>
                    <p className="text-[10px] text-slate-500">100% Genuine Certified Fabric</p>
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-slate-600">6204</td>
                  <td className="py-2.5 px-3 text-center text-slate-700">
                    <span className="font-medium">{item.sizeSnapshot}</span> · <span className="text-slate-500">{item.colourSnapshot}</span>
                    <span className="block text-[9px] font-mono text-slate-400">{item.skuSnapshot}</span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold text-slate-900">{item.quantity}</td>
                  <td className="py-2.5 px-3 text-right text-slate-700 font-mono">{formatINR(item.unitPrice)}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900 font-mono">{formatINR(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Calculation & Tax Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-[11px] text-slate-600">
            <p className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">GST Tax Distribution</p>
            <div className="flex justify-between border-b border-slate-200 pb-1">
              <span>Central GST (CGST @ 9%):</span>
              <span className="font-mono">₹{cgst}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-1">
              <span>State GST (SGST @ 9%):</span>
              <span className="font-mono">₹{sgst}</span>
            </div>
            <div className="flex justify-between font-semibold text-slate-800">
              <span>Total Tax (18% Included):</span>
              <span className="font-mono">{formatINR(order.tax)}</span>
            </div>
            <p className="text-[10px] text-slate-400 italic pt-1">
              * Taxes are inclusive and computed per Indian GST norms for apparel.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/80 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Items Subtotal:</span>
              <span className="font-mono font-medium">{formatINR(order.subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-rose-700 font-semibold">
                <span>Coupon Discount ({order.couponCode || "PROMO"}):</span>
                <span className="font-mono">- {formatINR(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Delivery &amp; Freight:</span>
              <span className="font-mono">{delivery === 0 ? "FREE" : formatINR(order.deliveryCharge)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>GST (Included):</span>
              <span className="font-mono">{formatINR(order.tax)}</span>
            </div>
            <div className="flex justify-between text-sm font-extrabold text-slate-900 border-t border-slate-300 pt-2 bg-amber-50/50 p-2 rounded-lg">
              <span>Grand Total:</span>
              <span className="font-mono text-base text-[#141416]">{formatINR(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Legal Disclaimer & Authorized Signature */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
          <div className="text-[10px] text-slate-500 space-y-1">
            <p className="font-bold text-slate-700 uppercase">Terms &amp; Conditions:</p>
            <p>1. Returns or exchanges accepted within 7 days of delivery in pristine condition with tags intact.</p>
            <p>2. Goods once sold are covered under Fashion Cart guarantee of authenticity.</p>
            <p>3. For questions, contact support: {business?.email || "support@fashioncart.shop"}</p>
          </div>

          <div className="text-right flex flex-col items-end justify-between space-y-2">
            <div className="border border-dashed border-[#141416]/40 p-2 rounded-lg bg-amber-50/30 text-center inline-block">
              <p className="text-[9px] font-bold text-[#141416] uppercase tracking-wider">FASHION CART DIGITAL STAMP</p>
              <p className="text-[10px] font-bold text-[#8E6C0C]">✓ VERIFIED &amp; AUTHORIZED</p>
            </div>
            <p className="text-[10px] text-slate-400">Authorized Signatory · Fashion Cart Logistics Hub</p>
          </div>
        </div>
      </div>
    </div>
  );
}
