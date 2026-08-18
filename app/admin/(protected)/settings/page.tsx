import { prisma } from "@/lib/db";
import Link from "next/link";
import PaymentSettingsForm from "@/components/admin/PaymentSettingsForm";
import DeliverySettingsForm from "@/components/admin/DeliverySettingsForm";
import BusinessSettingsForm from "@/components/admin/BusinessSettingsForm";
import EmailSettingsForm from "@/components/admin/EmailSettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const [paymentSettings, deliverySettings, businessSettings, emailSettings] = await Promise.all([
    prisma.paymentSettings.findFirst({ where: { isActive: true } }),
    prisma.deliverySettings.findFirst(),
    prisma.businessSettings.findFirst(),
    prisma.emailSettings.findFirst(),
  ]);

  return (
    <div className="max-w-3xl space-y-10">
      <div>
        <h1 className="font-display text-3xl font-bold">Store Settings &amp; Data Center</h1>
        <p className="text-xs text-dim mt-1">Manage payment options, delivery rates, transactional email notifications, and CSV exports.</p>
      </div>

      {/* CSV Data Export Center */}
      <section className="p-6 rounded-2xl border space-y-4" style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}>
        <div>
          <h2 className="font-display text-base font-bold">📊 Shop Data &amp; Report Exports</h2>
          <p className="text-xs text-dim mt-0.5">Download real-time database records in CSV spreadsheet format.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <a
            href="/api/admin/export?type=template"
            download
            className="p-4 rounded-xl border flex flex-col items-center justify-center text-center hover:border-amber-500 transition-all card-theme bg-amber-500/5"
            style={{ borderColor: "var(--fc-border)" }}
          >
            <span className="text-2xl mb-1">📋</span>
            <span className="font-bold text-xs text-amber-700 dark:text-amber-300">Bulk Upload Template</span>
            <span className="text-[10px] text-dim mt-0.5">Sample CSV to bulk add products</span>
          </a>

          <a
            href="/api/admin/export?type=products"
            download
            className="p-4 rounded-xl border flex flex-col items-center justify-center text-center hover:border-primary transition-all card-theme"
            style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}
          >
            <span className="text-2xl mb-1">👗</span>
            <span className="font-bold text-xs">Export All Products</span>
            <span className="text-[10px] text-dim mt-0.5">Catalog SKUs, prices &amp; stock</span>
          </a>

          <a
            href="/api/admin/export?type=orders"
            download
            className="p-4 rounded-xl border flex flex-col items-center justify-center text-center hover:border-primary transition-all card-theme"
            style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}
          >
            <span className="text-2xl mb-1">📦</span>
            <span className="font-bold text-xs">Export All Orders</span>
            <span className="text-[10px] text-dim mt-0.5">Full customer orders &amp; status</span>
          </a>

          <a
            href="/api/admin/export?type=inventory"
            download
            className="p-4 rounded-xl border flex flex-col items-center justify-center text-center hover:border-primary transition-all card-theme"
            style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}
          >
            <span className="text-2xl mb-1">📦</span>
            <span className="font-bold text-xs">Export Inventory</span>
            <span className="text-[10px] text-dim mt-0.5">Stock by SKU &amp; size levels</span>
          </a>
        </div>
      </section>

      {/* Transactional Email & Notifications Settings */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-base font-bold">✉️ Transactional Email &amp; SMTP Gateway</h2>
            <p className="text-xs text-dim">Configure outgoing customer notifications for registration, invoices, orders, and password resets.</p>
          </div>
          <Link
            href="/admin/emails"
            className="text-xs font-bold text-primary hover:underline"
          >
            View Email Audit Logs →
          </Link>
        </div>
        <EmailSettingsForm initial={emailSettings} />
      </section>

      {/* Payment Settings */}
      <section className="space-y-3">
        <div>
          <h2 className="font-display text-base font-bold">💳 Payment Methods &amp; UPI Configuration</h2>
          <p className="text-xs text-dim">Upload your shop UPI QR and toggle Cash on Delivery.</p>
        </div>
        <PaymentSettingsForm
          initial={{
            qrCodePath: paymentSettings?.qrCodePath ?? null,
            upiId: paymentSettings?.upiId ?? "",
            instructions: paymentSettings?.instructions ?? "",
            codEnabled: paymentSettings?.codEnabled ?? true,
            codFee: paymentSettings?.codFee ? Number(paymentSettings.codFee) : 0,
          }}
        />
      </section>

      {/* Delivery Settings */}
      <section className="space-y-3">
        <div>
          <h2 className="font-display text-base font-bold">🚚 Delivery &amp; Shipping Rates</h2>
          <p className="text-xs text-dim">Set flat delivery charges and free delivery threshold.</p>
        </div>
        <DeliverySettingsForm
          initial={{
            defaultCharge: deliverySettings ? Number(deliverySettings.defaultCharge) : 0,
            freeDeliveryAbove: deliverySettings?.freeDeliveryAbove ? Number(deliverySettings.freeDeliveryAbove) : null,
          }}
        />
      </section>

      {/* Business Information */}
      <section className="space-y-3">
        <div>
          <h2 className="font-display text-base font-bold">🧾 Business Information (GST &amp; PDF Invoices)</h2>
          <p className="text-xs text-dim">
            These details are printed automatically on generated PDF Tax Invoices and customer receipts.
          </p>
        </div>
        <BusinessSettingsForm
          initial={{
            businessName: businessSettings?.businessName ?? "",
            businessAddress: businessSettings?.businessAddress ?? "",
            gstin: businessSettings?.gstin ?? "",
            phone: businessSettings?.phone ?? "",
            email: businessSettings?.email ?? "",
          }}
        />
      </section>
    </div>
  );
}
