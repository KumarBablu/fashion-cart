import Link from "next/link";

export const metadata = {
  title: "Terms & Conditions — Fashion Cart",
  description: "Review Fashion Cart's terms of service, purchasing agreements, GST billing regulations, intellectual property protections, and Siwan, Bihar legal jurisdiction.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-14 space-y-10">
      {/* Header */}
      <div className="border-b border-[#E7DFD5] pb-6 space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FBF4E2] border border-[#C59B27]/40 text-xs font-bold uppercase tracking-wider text-[#8E6C0C]">
          <span>⚖️ Standard Terms of Service</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#141416]">
          Terms &amp; Conditions
        </h1>
        <p className="text-xs text-[#787C87]">Last updated: August 2026 · Governing all purchases and catalog browsing</p>
      </div>

      {/* Main Content */}
      <div className="space-y-8 text-xs sm:text-sm text-[#4B4E56] leading-relaxed">
        <section className="space-y-3">
          <h2 className="font-display text-lg font-bold text-[#141416]">
            1. Acceptance of Terms
          </h2>
          <p>
            By accessing, browsing, or making a purchase on the Fashion Cart website (accessible at <Link href="/" className="text-[#C59B27] underline">fashioncart.shop</Link>), you agree to be bound by these Terms and Conditions, our <Link href="/privacy-policy" className="text-[#C59B27] underline">Privacy Policy</Link>, and our <Link href="/return-policy" className="text-[#C59B27] underline">Return Policy</Link>.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg font-bold text-[#141416]">
            2. Product Information &amp; Color Accuracy
          </h2>
          <p>
            We strive to display garment colors, textures, and embroidery details with highest photographic fidelity. However, as photographic lighting and individual smartphone/monitor screen calibrations vary slightly, minor nuances in fabric hue do not constitute a defect.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg font-bold text-[#141416]">
            3. Pricing, GST &amp; Tax Invoices
          </h2>
          <p>
            All product prices listed on Fashion Cart are inclusive of applicable Goods and Services Tax (GST) under Indian tax laws unless stated otherwise. Every completed purchase generates an authentic computer-generated GST tax invoice downloadable directly from your order dashboard.
          </p>
          <p>
            We reserve the right to correct pricing typographical errors before an order is dispatched. In the rare event of an obvious pricing error, we will notify you and offer the option to confirm at the correct price or cancel for a 100% full refund.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg font-bold text-[#141416]">
            4. Order Placement &amp; Payment Verification
          </h2>
          <p>
            Orders placed via UPI QR Scan require valid UTR / transaction ID confirmation or manual screenshot verification. We reserve the right to reject orders that submit falsified or unverified payment references.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg font-bold text-[#141416]">
            5. Intellectual Property Rights
          </h2>
          <p>
            All branding, logos, trademarks, high-resolution garment imagery, lookbook photographs, and design system elements on this website are the exclusive intellectual property of Fashion Cart. Unauthorized commercial reproduction, web scraping, or resale is strictly prohibited.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg font-bold text-[#141416]">
            6. Governing Law &amp; Jurisdiction
          </h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the Republic of India. Any disputes arising in connection with orders or website usage shall be subject to the exclusive jurisdiction of the competent courts in Siwan, Bihar.
          </p>
        </section>
      </div>

      {/* Support Box */}
      <div className="p-6 rounded-2xl border border-[#E7DFD5] bg-[#F4EFEA] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="font-bold text-sm text-[#141416]">Have legal or partnership questions?</p>
          <p className="text-xs text-[#787C87]">Contact our legal compliance team at Fashioncart.support@gmail.com</p>
        </div>
        <Link
          href="/contact"
          className="px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider bg-[#141416] text-white hover:bg-[#25262B] transition-colors shrink-0"
        >
          Contact Legal Desk →
        </Link>
      </div>
    </div>
  );
}
