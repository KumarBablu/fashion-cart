"use client";

import { formatINR } from "@/lib/format";

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
          className="px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider bg-[#0C3B2E] text-white hover:bg-[#144E3E] shadow-sm flex items-center gap-1.5"
        >
          <span>🖨️</span> Print Parcel Label
        </button>
      </div>

      {/* Label Canvas (Designed to fit 4x6 inch standard thermal/adhesive label) */}
      <div className="border-2 border-black p-4 space-y-3 bg-white text-black">
        {/* Top Carrier / Barcode Header */}
        <div className="flex items-center justify-between border-b-2 border-black pb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌿</span>
            <div>
              <p className="font-extrabold text-sm tracking-wider uppercase">{business?.businessName || "FASHION CART"}</p>
              <p className="text-[9px] uppercase tracking-widest text-slate-600">Standard Express Delivery</p>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block px-2.5 py-1 rounded bg-black text-white text-xs font-black tracking-widest">
              {isPrepaid ? "PREPAID · DO NOT COLLECT CASH" : `COD: ${formatINR(order.total)}`}
            </span>
          </div>
        </div>

        {/* Courier Routing Barcode Box */}
        <div className="border border-black p-2 text-center rounded bg-slate-50">
          <p className="font-mono text-xs font-bold tracking-widest">ORDER #{order.orderNumber}</p>
          <div className="my-1.5 flex justify-center items-center gap-1 h-8">
            {/* High-contrast simulated barcode stripes */}
            {[4, 2, 6, 1, 3, 5, 2, 8, 2, 4, 1, 7, 3, 5, 2, 6, 4, 2, 5, 1, 3, 7, 2, 4, 6].map((w, i) => (
              <span
                key={i}
                className="bg-black inline-block h-full"
                style={{ width: `${w * 1.5}px` }}
              />
            ))}
          </div>
          <p className="text-[9px] font-mono text-slate-600">
            AWB: {order.trackingNumber || `AWB-FC-${order.orderNumber.replace("FC-", "")}`} · Carrier: {order.carrierName || "BlueDart / Delhivery Express"}
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

        {/* FROM / RETURN TO SENDER */}
        <div className="border border-black p-2.5 rounded text-[10px] space-y-0.5 bg-white">
          <span className="font-extrabold uppercase text-[9px] text-slate-700 block">IF UNDELIVERED, RETURN TO:</span>
          <p className="font-bold">{business?.businessName || "Fashion Cart Fulfillment Hub"}</p>
          <p className="text-slate-700">{business?.businessAddress || "108 Fashion Avenue, Indiranagar, Bengaluru, Karnataka - 560038"}</p>
          <p className="text-slate-700">Helpline: {business?.phone || "+91 98765 43210"} · {business?.email || "support@fashioncart.shop"}</p>
        </div>

        {/* Package Packing Checklist */}
        <div className="border border-black p-2 rounded text-[10px]">
          <div className="flex justify-between font-bold border-b border-black/20 pb-1 mb-1">
            <span>PACKING CHECKLIST ({totalItems} Items)</span>
            <span>Total Value: {formatINR(order.total)}</span>
          </div>
          <div className="space-y-1 divide-y divide-slate-100">
            {order.items.map((item, i) => (
              <div key={item.id} className="flex justify-between pt-0.5">
                <span>
                  {i + 1}. {item.productNameSnapshot} ({item.sizeSnapshot} / {item.colourSnapshot})
                </span>
                <span className="font-mono font-bold">Qty: {item.quantity} [ ]</span>
              </div>
            ))}
          </div>
        </div>

        {/* Caution & Fragile Footer */}
        <div className="flex items-center justify-between border-t-2 border-black pt-2 text-[9px] font-bold uppercase tracking-wider text-slate-700">
          <span>⚠️ HANDLE WITH CARE · KEEP DRY</span>
          <span>🔒 TAMPER-EVIDENT PACKAGING</span>
        </div>
      </div>
    </div>
  );
}
