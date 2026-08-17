"use client";

import { useState } from "react";
import InvoiceDocument from "./InvoiceDocument";
import ParcelShippingLabel from "./ParcelShippingLabel";

export default function InvoiceViewTabs({
  order,
  business,
  isAdmin = false,
}: {
  order: any;
  business: any;
  isAdmin?: boolean;
}) {
  const [activeTab, setActiveTab] = useState<"invoice" | "parcel">("invoice");

  // If regular customer, strictly show only their official Tax Invoice
  if (!isAdmin) {
    return <InvoiceDocument order={order} business={business} />;
  }

  return (
    <div className="space-y-6">
      {/* Screen Tab Switcher for Admin Only */}
      <div className="flex items-center justify-center print:hidden">
        <div className="inline-flex p-1.5 rounded-full border border-slate-200 bg-white shadow-xs">
          <button
            onClick={() => setActiveTab("invoice")}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "invoice"
                ? "bg-[#0C3B2E] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>📄</span> Official Tax Invoice &amp; Receipt
          </button>
          <button
            onClick={() => setActiveTab("parcel")}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "parcel"
                ? "bg-[#0C3B2E] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>📦</span> Parcel Shipping Label (4×6 Admin Only)
          </button>
        </div>
      </div>

      {/* Render Selected View */}
      {activeTab === "invoice" ? (
        <InvoiceDocument order={order} business={business} />
      ) : (
        <ParcelShippingLabel order={order} business={business} />
      )}
    </div>
  );
}
