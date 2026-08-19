import Link from "next/link";

export const metadata = {
  title: "Shipping & Delivery Policy — Fashion Cart",
  description: "Learn about Fashion Cart's express doorstep shipping timelines, free delivery thresholds, courier logistics partners, real-time AWB tracking, and parcel insurance.",
};

export default function ShippingPolicyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-14 space-y-10">
      {/* Header */}
      <div className="border-b border-[#E7DFD5] pb-6 space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FBF4E2] border border-[#C59B27]/40 text-xs font-bold uppercase tracking-wider text-[#8E6C0C]">
          <span>🚚 Reliable Express Logistics</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#141416]">
          Shipping &amp; Delivery Policy
        </h1>
        <p className="text-xs text-[#787C87]">Last updated: August 2026 · Effective across India</p>
      </div>

      {/* Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-[#E7DFD5] bg-[#FAF8F5] space-y-1">
          <p className="text-2xl font-black text-[#141416]">₹0 FREE</p>
          <p className="text-xs font-bold text-[#141416]">Orders Above ₹499</p>
          <p className="text-[11px] text-[#787C87]">Nominal ₹99 flat fee on orders below ₹499</p>
        </div>
        <div className="p-5 rounded-2xl border border-[#E7DFD5] bg-[#FAF8F5] space-y-1">
          <p className="text-2xl font-black text-[#141416]">2 – 3 Days</p>
          <p className="text-xs font-bold text-[#141416]">Metro Deliveries</p>
          <p className="text-[11px] text-[#787C87]">Bengaluru, Mumbai, Delhi NCR, Hyderabad, Chennai</p>
        </div>
        <div className="p-5 rounded-2xl border border-[#E7DFD5] bg-[#FAF8F5] space-y-1">
          <p className="text-2xl font-black text-[#141416]">100%</p>
          <p className="text-xs font-bold text-[#141416]">Transit Insured</p>
          <p className="text-[11px] text-[#787C87]">Full coverage against transit loss or damage</p>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="space-y-8 text-xs sm:text-sm text-[#4B4E56] leading-relaxed">
        <section className="space-y-3">
          <h2 className="font-display text-lg font-bold text-[#141416]">
            1. Order Processing &amp; Dispatch Timeline
          </h2>
          <p>
            All confirmed orders are processed, quality-inspected, and packed in tamper-evident protective luxury cartons at our central logistics hub within <strong>24 to 48 hours</strong> (excluding national holidays and Sundays).
          </p>
          <p>
            For personalized or bespoke made-to-order couture items (such as custom-stitched sarees or tailored blazers), an additional 2–3 crafting days may apply as communicated on the product page.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg font-bold text-[#141416]">
            2. Delivery Timelines by Region
          </h2>
          <div className="border border-[#E7DFD5] rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-[#F4EFEA] text-[#141416] font-bold">
                <tr>
                  <th className="p-3">Destination Region</th>
                  <th className="p-3">Estimated Transit Window</th>
                  <th className="p-3">Courier Partners</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7DFD5]">
                <tr>
                  <td className="p-3 font-semibold text-[#141416]">Bihar &amp; Neighboring States</td>
                  <td className="p-3">1 to 2 Business Days (Express Hub)</td>
                  <td className="p-3 text-[#787C87]">BlueDart / Delhivery Express</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-[#141416]">Tier 1 Metros (Mumbai, Delhi, Chennai, Kolkata, Hyderabad, Pune)</td>
                  <td className="p-3">2 to 3 Business Days</td>
                  <td className="p-3 text-[#787C87]">BlueDart Air / DTDC Priority</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-[#141416]">Tier 2 &amp; Tier 3 Cities (Rest of India)</td>
                  <td className="p-3">4 to 6 Business Days</td>
                  <td className="p-3 text-[#787C87]">Delhivery / XpressBees / India Post Speed Post</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-[#141416]">Special Remote Zones (North-East, J&amp;K, Islands)</td>
                  <td className="p-3">6 to 8 Business Days</td>
                  <td className="p-3 text-[#787C87]">India Post Air / BlueDart</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg font-bold text-[#141416]">
            3. Real-Time Tracking &amp; SMS/WhatsApp Notifications
          </h2>
          <p>
            As soon as your parcel is scanned by our logistics carrier, you will receive an automated notification containing your <strong>AWB Tracking Number</strong> and direct tracking URL via both email and WhatsApp.
          </p>
          <p>
            You can also track your shipment live at any time by visiting your <Link href="/account" className="text-[#C59B27] font-bold hover:underline">My Account Orders Dashboard</Link>.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg font-bold text-[#141416]">
            4. Cash on Delivery (COD) Guidelines
          </h2>
          <p>
            Cash on Delivery is available across 99% of serviceable Indian pincodes. For seamless delivery, please ensure exact cash or your UPI app (GPay / PhonePe / Paytm) is ready when our courier delivery partner arrives at your doorstep.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg font-bold text-[#141416]">
            5. Tampered or Damaged Parcels
          </h2>
          <p>
            If you notice that the outer parcel bag is cut, torn, or tampered with at the time of delivery, please <strong>refuse delivery</strong> or record a quick unboxing video and notify our customer concierge immediately on WhatsApp at <a href="https://wa.me/919771039201" className="text-[#C59B27] font-bold hover:underline">+91 9771039201</a>. We will dispatch an instant replacement free of cost.
          </p>
        </section>
      </div>

      {/* Support Strip */}
      <div className="p-6 rounded-2xl border border-[#E7DFD5] bg-[#F4EFEA] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="font-bold text-sm text-[#141416]">Need assistance tracking an existing shipment?</p>
          <p className="text-xs text-[#787C87]">Our logistics desk is active 7 days a week.</p>
        </div>
        <div className="flex gap-2.5">
          <Link
            href="/account"
            className="px-5 py-2.5 rounded-full text-xs font-bold uppercase bg-[#141416] text-white hover:bg-[#25262B] transition-colors"
          >
            Track Order →
          </Link>
          <Link
            href="/contact"
            className="px-5 py-2.5 rounded-full text-xs font-bold uppercase border border-[#C59B27] text-[#141416] hover:bg-white transition-colors"
          >
            Contact Help Desk
          </Link>
        </div>
      </div>
    </div>
  );
}
