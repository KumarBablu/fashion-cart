export const metadata = {
  title: "Privacy Policy & Data Protection — Fashion Cart",
  description: "Learn how Fashion Cart collects, safeguards, and processes your personal information in compliance with Indian DPDP Act and international data standards.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-14 space-y-10">
      {/* Header */}
      <div className="border-b border-[#E7DFD5] pb-6 space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FBF4E2] border border-[#C59B27]/40 text-xs font-bold uppercase tracking-wider text-[#8E6C0C]">
          <span>🔒 256-Bit SSL Encrypted &amp; Secure</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#141416]">
          Privacy Policy &amp; Data Protection
        </h1>
        <p className="text-xs text-[#787C87]">Last updated: August 2026 · Committed to zero data selling</p>
      </div>

      {/* Main Content */}
      <div className="space-y-8 text-xs sm:text-sm text-[#4B4E56] leading-relaxed">
        <section className="space-y-3">
          <h2 className="font-display text-lg font-bold text-[#141416]">
            1. Our Commitment to Your Privacy
          </h2>
          <p>
            At Fashion Cart (referred to as &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;), protecting your personal privacy is fundamental to our boutique values. We collect only the information necessary to fulfill your orders, deliver personalized fashion recommendations, and ensure frictionless customer support.
          </p>
          <p className="font-semibold text-[#141416]">
            We do NOT sell, rent, trade, or monetize your personal information to any third-party advertisers under any circumstances.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg font-bold text-[#141416]">
            2. Information We Collect
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-[#E7DFD5] bg-[#FAF8F5] space-y-1.5">
              <p className="font-bold text-[#141416]">Account &amp; Contact Data</p>
              <p className="text-[#787C87]">Your name, email address, mobile phone number, delivery address, and account password (stored securely as one-way cryptographic bcrypt hashes).</p>
            </div>
            <div className="p-4 rounded-xl border border-[#E7DFD5] bg-[#FAF8F5] space-y-1.5">
              <p className="font-bold text-[#141416]">Transaction &amp; Order Data</p>
              <p className="text-[#787C87]">Order item records, sizes chosen, delivery preferences, invoice numbers, and payment verification receipts (such as UPI UTR numbers or transaction IDs).</p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg font-bold text-[#141416]">
            3. Payment Security &amp; Zero Storage of Sensitive Card Details
          </h2>
          <p>
            All direct payments (UPI, QR Codes, Credit/Debit Cards, and NetBanking) are processed through RBI-authorized, PCI-DSS Level 1 compliant payment gateways via 256-bit SSL encrypted channels.
          </p>
          <p>
            <strong>Zero Card Data Storage:</strong> In strict adherence to Reserve Bank of India (RBI) card tokenization directives, Fashion Cart does <strong>never</strong> store your credit/debit card numbers, CVV codes, UPI PINs, or internet banking passwords on our servers.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg font-bold text-[#141416]">
            4. Third-Party Service Providers &amp; Data Sharing
          </h2>
          <p>
            We share your necessary shipping and contact details strictly with verified partners essential for order fulfillment:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs">
            <li><strong>Logistics &amp; Courier Partners:</strong> BlueDart, Delhivery, DTDC, and India Post for delivering your parcels and sending real-time AWB delivery tracking updates.</li>
            <li><strong>Payment Gateways:</strong> RBI-licensed payment aggregators for processing secure transactions and initiating refunds.</li>
            <li><strong>Transactional Notification Providers:</strong> Secure SMS and email infrastructure for sending automated receipts, tax invoices, and verification codes.</li>
          </ul>
          <p className="text-xs text-[#787C87]">
            All third-party partners are bound by strict non-disclosure and data protection confidentiality agreements.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg font-bold text-[#141416]">
            5. How We Use Your Data
          </h2>
          <ul className="list-disc pl-5 space-y-1.5 text-xs">
            <li><strong>Order Fulfillment:</strong> Processing payments, printing shipping labels, and dispatching packages to your address.</li>
            <li><strong>Transactional Updates:</strong> Sending automated email &amp; WhatsApp order confirmations, AWB tracking links, and GST tax invoices.</li>
            <li><strong>Security &amp; Fraud Prevention:</strong> Protecting customer accounts against unauthorized password resets or fraudulent chargebacks.</li>
            <li><strong>Customer Care:</strong> Answering inquiries submitted via our contact forms or WhatsApp concierge desk.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg font-bold text-[#141416]">
            6. Cookies &amp; Local Storage
          </h2>
          <p>
            We use essential secure session cookies to remember items in your shopping bag, maintain your active login status, and preserve your wishlist across devices. You can control or clear cookies in your browser settings at any time.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg font-bold text-[#141416]">
            7. Your Data Rights &amp; Deletion Requests
          </h2>
          <p>
            Under the Indian Digital Personal Data Protection (DPDP) Act, 2023, you have the right to access, rectify, or request permanent deletion of your personal account data.
          </p>
          <p>
            To request data export or account closure, please email our Data Protection Officer at <a href="mailto:Fashioncart.support@gmail.com" className="text-[#C59B27] font-bold underline">Fashioncart.support@gmail.com</a>. Requests are fulfilled within 7 business days.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg font-bold text-[#141416]">
            8. Grievance Officer
          </h2>
          <p>
            In accordance with the Information Technology Act, 2000 and the Rules made thereunder:
          </p>
          <div className="p-4 rounded-xl border border-[#E7DFD5] bg-[#FAF8F5] text-xs space-y-1">
            <p><strong>Designation:</strong> Grievance Redressal &amp; Data Privacy Officer</p>
            <p><strong>Entity Name:</strong> Fashion Cart</p>
            <p><strong>Registered Address:</strong> Sonar Toli, City: Siwan, State: Bihar, PIN: 841226, India</p>
            <p><strong>Email:</strong> <a href="mailto:Fashioncart.support@gmail.com" className="text-[#C59B27] font-bold underline">Fashioncart.support@gmail.com</a></p>
            <p><strong>Direct Helpline:</strong> +91 97710 39201 (Mon – Sun, 10:00 AM – 9:00 PM IST)</p>
          </div>
        </section>
      </div>
    </div>
  );
}
