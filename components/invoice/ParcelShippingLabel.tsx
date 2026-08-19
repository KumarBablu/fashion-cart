"use client";

import Image from "next/image";
import { formatINR } from "@/lib/format";
import { generateBarcodeSvg } from "@/lib/invoice/barcode";

type ParcelProps = {
  order: {
    id: string;
    orderNumber: string;
    createdAt: string | Date;
    total: number | string;
    paymentMethod: string;
    carrierName?: string | null;
    trackingNumber?: string | null;
    customerNotes?: string | null;
    shippingAddressSnapshot: {
      fullName: string;
      mobileNumber: string;
      addressLine1: string;
      addressLine2?: string | null;
      city: string;
      state: string;
      pinCode: string;
      landmark?: string | null;
    };
    items: {
      id: string;
      productNameSnapshot: string;
      skuSnapshot: string;
      colourSnapshot: string;
      sizeSnapshot: string;
      quantity: number;
    }[];
    user: { name: string; email: string; phone?: string | null };
    payment?: {
      status: string;
      utrNumber?: string | null;
    } | null;
  };
  business?: {
    businessName: string;
    businessAddress: string | null;
    phone: string | null;
    email: string | null;
  } | null;
};

export default function ParcelShippingLabel({ order, business }: ParcelProps) {
  const addr = order.shippingAddressSnapshot;
  const isPrepaid = order.payment?.status === "VERIFIED" || order.paymentMethod === "MANUAL_UPI" || order.paymentMethod === "ONLINE_GATEWAY";
  const totalItems = order.items.reduce((s, i) => s + i.quantity, 0);

  const barcodeSvg = generateBarcodeSvg(order.orderNumber, 36, 1.4);

  function handlePrint() {
    window.print();
  }

  return (
    <div className="bg-white text-slate-900 font-sans antialiased max-w-xl mx-auto p-4 rounded-2xl border-2 border-dashed border-slate-400 shadow-lg print:border-2 print:border-black print:shadow-none print:p-4 print:max-w-none print:m-0">
      {/* Screen Control Bar */}
      <div className="flex items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-200 print:hidden">
        <div>
          <h2 className="text-base font-bold text-slate-900">📦 Parcel Shipping Label (4×6 Format)</h2>
          <p className="text-[11px] text-slate-500">Cut along the dashed border and paste onto the parcel box/polybag.</p>
        </div>
        <button
          onClick={handlePrint}
          className="px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider bg-[#141416] text-white hover:bg-[#25262B] shadow-sm flex items-center gap-1.5 cursor-pointer"
        >
          <span>🖨️</span> Print Parcel Label
        </button>
      </div>

      {/* Label Canvas (Designed to fit 4x6 inch standard thermal/adhesive label) */}
      <div className="border-2 border-black p-4 space-y-3 bg-white text-black">
        {/* Top Carrier / Barcode Header */}
        <div className="flex items-center justify-between border-b-2 border-black pb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="relative h-8 w-8 overflow-hidden shrink-0">
              <Image
                src="/fashion-cart-logo-transparent.svg"
                alt="Logo"
                fill
                sizes="32px"
                className="object-contain"
              />
            </div>
            <div>
              <p className="font-black text-sm tracking-wider uppercase">{business?.businessName || "Fashion Cart"}</p>
              <p className="text-[9px] uppercase tracking-widest text-slate-600">Luxury Logistics &amp; Express Delivery</p>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block px-2.5 py-1 rounded bg-black text-white text-xs font-black tracking-widest">
              {isPrepaid ? "PREPAID · DO NOT COLLECT CASH" : `COD: ${formatINR(order.total)}`}
            </span>
          </div>
        </div>

        {/* Courier Routing Barcode Box */}
        <div className="border border-black p-2 text-center rounded bg-slate-50 space-y-1">
          <p className="font-mono text-xs font-bold tracking-widest">ORDER #{order.orderNumber}</p>
          <div
            className="w-full h-9 flex justify-center"
            dangerouslySetInnerHTML={{ __html: barcodeSvg }}
          />
          <p className="text-[9px] font-mono text-slate-600">
            AWB: {order.trackingNumber || `AWB-FC-${order.orderNumber.replace(/[^0-9]/g, "").slice(-8)}`} · Carrier: {order.carrierName || "Delhivery / BlueDart Express"}
          </p>
        </div>

        {/* SHIP TO (High-Visibility Box for Delivery Courier) */}
        <div className="border-2 border-black p-3 rounded bg-slate-50">
          <div className="flex justify-between items-center border-b border-black/20 pb-1 mb-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider bg-black text-white px-2 py-0.5 rounded">
              SHIP TO / RECIPIENT
            </span>
            <span className="text-[10px] font-bold text-slate-700">Date: {new Date(order.createdAt).toLocaleDateString("en-IN")}</span>
          </div>

          <p className="text-base font-extrabold uppercase tracking-wide text-black">{addr.fullName}</p>
          <p className="text-xs font-semibold leading-snug mt-1">
            {addr.addressLine1}
            {addr.addressLine2 ? `, ${addr.addressLine2}` : ""}
          </p>
          <p className="text-xs font-semibold leading-snug">
            {addr.city}, {addr.state}
          </p>
          {addr.landmark && (
            <p className="text-[11px] font-medium text-slate-700 mt-0.5">
              Landmark: {addr.landmark}
            </p>
          )}

          {/* Huge Bold PIN Code for Courier Scanning */}
          <div className="mt-2 pt-2 border-t border-black flex justify-between items-center">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">PIN CODE / ROUTING:</span>
              <span className="text-2xl font-black tracking-widest font-mono text-black">{addr.pinCode}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">CONTACT MOBILE:</span>
              <span className="text-sm font-black font-mono text-black">+91 {addr.mobileNumber}</span>
            </div>
          </div>
        </div>

        {/* Package Contents / Return Address Grid */}
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          {/* Dispatcher Return Address */}
          <div className="border border-black p-2 rounded bg-slate-50">
            <p className="font-bold uppercase text-[9px] tracking-wider text-slate-600">IF UNDELIVERED, RETURN TO:</p>
            <p className="font-extrabold text-slate-900 mt-0.5">{business?.businessName || "Fashion Cart"} (Returns Dept)</p>
            <p className="text-slate-600 leading-tight">
              {business?.businessAddress || "Sonar Toli, City: Siwan, State: Bihar, PIN: 841226"}
            </p>
            <p className="text-slate-700 mt-0.5 font-semibold">Ph: {business?.phone || "+91 97710 39201"}</p>
          </div>

          {/* Itemized Manifest Summary */}
          <div className="border border-black p-2 rounded bg-slate-50 flex flex-col justify-between">
            <div>
              <p className="font-bold uppercase text-[9px] tracking-wider text-slate-600">PARCEL CONTENTS ({totalItems} PCS):</p>
              <div className="mt-1 space-y-0.5 max-h-16 overflow-hidden">
                {order.items.map((it) => (
                  <p key={it.id} className="truncate text-slate-800">
                    • {it.productNameSnapshot} ({it.sizeSnapshot}) ×{it.quantity}
                  </p>
                ))}
              </div>
            </div>
            <div className="border-t border-black/20 pt-1 mt-1 flex justify-between font-bold text-slate-900">
              <span>Total Declared Value:</span>
              <span>{formatINR(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Footer Warning / Anti-Tamper Note */}
        <div className="text-center pt-1 border-t border-black text-[9px] font-bold text-slate-700">
          ⚠️ DO NOT ACCEPT IF SECURITY TAMPER-EVIDENT SEAL IS BROKEN OR DAMAGED.
        </div>
      </div>
    </div>
  );
}
