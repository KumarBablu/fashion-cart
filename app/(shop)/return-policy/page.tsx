import Link from "next/link";

export const metadata = {
  title: "7-Day Return & Exchange Policy — Fashion Cart",
  description: "Read Fashion Cart's 7-Day Hassle-Free Return, Size Exchange, and 100% Refund Policy. Simple reverse doorstep pickup with zero hidden charges.",
};

export default function ReturnPolicyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-14 space-y-10">
      {/* Header */}
      <div className="border-b border-[#E7DFD5] pb-6 space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FBF4E2] border border-[#C59B27]/40 text-xs font-bold uppercase tracking-wider text-[#8E6C0C]">
          <span>🔄 100% Buyer Protection</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#141416]">
          Return, Exchange &amp; Refund Policy
        </h1>
        <p className="text-xs text-[#787C87]">Last updated: August 2026 · Simple, transparent &amp; customer-first</p>
      </div>

      {/* 3 Step Return Process */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-[#E7DFD5] bg-[#FAF8F5] space-y-2">
          <span className="w-8 h-8 rounded-full bg-[#141416] text-white flex items-center justify-center text-xs font-bold">1</span>
          <p className="text-sm font-bold text-[#141416]">Request Return (Within 7 Days)</p>
          <p className="text-xs text-[#787C87]">Initiate via your Account dashboard or 1-Click WhatsApp Support.</p>
        </div>
        <div className="p-5 rounded-2xl border border-[#E7DFD5] bg-[#FAF8F5] space-y-2">
          <span className="w-8 h-8 rounded-full bg-[#C59B27] text-white flex items-center justify-center text-xs font-bold">2</span>
          <p className="text-sm font-bold text-[#141416]">Doorstep Reverse Pickup</p>
          <p className="text-xs text-[#787C87]">Our courier partner arrives at your address within 24–48 hours to collect the parcel.</p>
        </div>
        <div className="p-5 rounded-2xl border border-[#E7DFD5] bg-[#FAF8F5] space-y-2">
          <span className="w-8 h-8 rounded-full bg-[#557A68] text-white flex items-center justify-center text-xs font-bold">3</span>
          <p className="text-sm font-bold text-[#141416]">Instant Refund / Replacement</p>
          <p className="text-xs text-[#787C87]">Refund processed directly to your original payment method or UPI ID within 24 hours of inspection.</p>
        </div>
      </div>

      {/* Detailed Sections */}
      <div className="space-y-8 text-xs sm:text-sm text-[#4B4E56] leading-relaxed">
        <section className="space-y-3">
          <h2 className="font-display text-lg font-bold text-[#141416]">
            1. 7-Day Window for Returns &amp; Size Exchanges
          </h2>
          <p>
            We want you to be absolutely thrilled with the fit and quality of your Fashion Cart outfits. If a garment doesn&apos;t fit properly or meet your expectations, you have <strong>7 calendar days</strong> from the date of recorded delivery to request a size exchange or full refund.
          </p>
          <p>
            <strong>Zero Reverse Pickup Fee:</strong> For all size exchanges and defective items, reverse pickup is 100% free with no courier deduction.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg font-bold text-[#141416]">
            2. Return Eligibility &amp; Condition Guidelines
          </h2>
          <ul className="list-disc pl-5 space-y-1.5 text-xs">
            <li>Garments must be unworn, unwashed, and free from perfume scents, makeup stains, or pet hair.</li>
            <li>Original brand price tags, size labels, and hygiene liners (if applicable) must be intact.</li>
            <li>The item should be packed in its original luxury garment bag or box.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg font-bold text-[#141416]">
            3. Non-Returnable &amp; Final Sale Items
          </h2>
          <p className="text-xs">
            For hygiene and exclusivity reasons, the following categories are non-returnable unless received defective:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-[#787C87]">
            <li>Intimates, innerwear, and shapewear.</li>
            <li>Custom-tailored bespoke garments or altered sizes requested by the customer.</li>
            <li>Clearance items explicitly marked as &quot;Final Sale - No Returns&quot;.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg font-bold text-[#141416]">
            4. Refund Timelines &amp; Methods
          </h2>
          <div className="border border-[#E7DFD5] rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-[#F4EFEA] text-[#141416] font-bold">
                <tr>
                  <th className="p-3">Payment Method Used</th>
                  <th className="p-3">Refund Destination</th>
                  <th className="p-3">Credit Timeline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7DFD5]">
                <tr>
                  <td className="p-3 font-semibold text-[#141416]">UPI / QR Scan (GPay / PhonePe)</td>
                  <td className="p-3">Direct to Source UPI Bank Account</td>
                  <td className="p-3 text-[#557A68] font-bold">2 to 24 Hours (Instant)</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-[#141416]">Cash on Delivery (COD)</td>
                  <td className="p-3">Bank Transfer (NEFT / IMPS) or UPI ID provided</td>
                  <td className="p-3">24 to 48 Hours after pickup</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-[#141416]">Debit / Credit Cards / NetBanking</td>
                  <td className="p-3">Original Source Card / Bank Account</td>
                  <td className="p-3">3 to 5 Banking Days</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg font-bold text-[#141416]">
            5. Order Cancellation Policy
          </h2>
          <p>
            We offer full flexibility to cancel orders with zero penalty:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs">
            <li><strong>Cancellation Prior to Dispatch:</strong> You can cancel your order at any time before it has been dispatched from our warehouse directly from your <Link href="/account" className="text-[#C59B27] font-bold hover:underline">My Account Dashboard</Link> or by contacting customer support. A 100% full refund is credited immediately to your original payment method.</li>
            <li><strong>Cancellation Post Dispatch:</strong> If your parcel has already been handed over to the courier partner, you can simply decline the parcel upon delivery. Once marked as &quot;Return to Origin (RTO)&quot;, your refund will be processed promptly.</li>
            <li><strong>Cancellation Fee:</strong> Fashion Cart charges <strong>₹0 (Zero) cancellation fees</strong> on all eligible orders.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg font-bold text-[#141416]">
            6. How to Initiate a Return, Exchange, or Cancellation
          </h2>
          <p>
            You can initiate a request in two easy ways:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="p-4 rounded-xl border border-[#E7DFD5] bg-[#FAF8F5] space-y-2">
              <p className="font-bold text-xs text-[#141416]">Option A: Online Account Dashboard</p>
              <p className="text-xs text-[#787C87]">Navigate to your Orders tab in <Link href="/account" className="text-[#C59B27] underline">My Account</Link>, select your order, and click &quot;Request Exchange / Return&quot; or &quot;Cancel Order&quot;.</p>
            </div>
            <div className="p-4 rounded-xl border border-[#E7DFD5] bg-[#FAF8F5] space-y-2">
              <p className="font-bold text-xs text-[#141416]">Option B: 1-Click WhatsApp Support</p>
              <p className="text-xs text-[#787C87]">Send your Order Number and request directly to our dedicated customer support team on WhatsApp at <a href="https://wa.me/919771039201" className="text-[#C59B27] font-bold underline">+91 9771039201</a>.</p>
            </div>
          </div>
        </section>
      </div>

      {/* Support Box */}
      <div className="p-6 rounded-2xl border border-[#E7DFD5] bg-[#F4EFEA] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="font-bold text-sm text-[#141416]">Need assistance with sizing or exchange?</p>
          <p className="text-xs text-[#787C87]">We reply within 15 minutes during boutique hours.</p>
        </div>
        <a
          href="https://wa.me/919771039201?text=Hello%20Fashion%20Cart!%20I%20would%20like%20to%20request%20a%20size%20exchange."
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider bg-[#141416] text-white hover:bg-[#25262B] transition-colors shrink-0"
        >
          WhatsApp Return Desk →
        </a>
      </div>
    </div>
  );
}
