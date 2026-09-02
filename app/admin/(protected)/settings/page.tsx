import { prisma } from "@/lib/db";
import Link from "next/link";
import { getStoresControl } from "@/lib/stores";
import StoreAvailabilityManager from "@/components/admin/StoreAvailabilityManager";
import PaymentSettingsForm from "@/components/admin/PaymentSettingsForm";
import DeliverySettingsForm from "@/components/admin/DeliverySettingsForm";
import BusinessSettingsForm from "@/components/admin/BusinessSettingsForm";
import EmailSettingsForm from "@/components/admin/EmailSettingsForm";
import LogisticsSettingsForm from "@/components/admin/LogisticsSettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const [storesControl, paymentSettings, deliverySettings, businessSettings, emailSettings, logisticsSettings, pickupLocation] = await Promise.all([
    getStoresControl(),
    prisma.paymentSettings.findFirst({ where: { isActive: true } }),
    prisma.deliverySettings.findFirst(),
    prisma.businessSettings.findFirst(),
    prisma.emailSettings.findFirst(),
    prisma.logisticsSettings.findFirst(),
    prisma.pickupLocation.findFirst({ where: { isDefault: true } }),
  ]);

  return (
    <div className="w-full max-w-4xl space-y-10 pb-16">
      <div>
        <h1 className="font-display text-3xl font-bold">Store Settings &amp; Data Center</h1>
        <p className="text-xs text-dim mt-1">
          Control boutique visibility, manage payment gateways, delivery rates, transactional emails, and CSV exports.
        </p>
      </div>

      {/* 1. Multi-Store Visibility & Availability Control Desk */}
      <section className="space-y-3">
        <div>
          <h2 className="font-display text-base font-bold flex items-center gap-2">
            <span>🏪</span> Multi-Store Availability &amp; Shutdown Control
          </h2>
          <p className="text-xs text-dim">
            Enable or deactivate entire stores (Garments, Jewellery). When inactive, the store is closed to customers with your custom notice while orders remain traceable.
          </p>
        </div>
        <StoreAvailabilityManager initial={storesControl} />
      </section>

      {/* 2. CSV Data Export Center */}
      <section className="p-6 rounded-3xl border space-y-4" style={{ backgroundColor: "var(--fc-surface)", borderColor: "var(--fc-border)" }}>
        <div>
          <h2 className="font-display text-base font-bold">📊 Shop Data &amp; Report Exports</h2>
          <p className="text-xs text-dim mt-0.5">Download real-time database records in CSV spreadsheet format.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <a
            href="/api/admin/export?type=jewellery-template"
            download
            className="p-4 rounded-2xl border flex flex-col items-center justify-center text-center hover:border-amber-500 transition-all card-theme bg-amber-500/5"
            style={{ borderColor: "var(--fc-border)" }}
          >
            <span className="text-2xl mb-1">💍</span>
            <span className="font-bold text-xs text-amber-700 dark:text-amber-300">Jewellery (72 Col) Template</span>
            <span className="text-[10px] text-dim mt-0.5">Sample CSV for jewellery</span>
          </a>

          <a
            href="/api/admin/export?type=template"
            download
            className="p-4 rounded-2xl border flex flex-col items-center justify-center text-center hover:border-primary transition-all card-theme bg-slate-500/5"
            style={{ borderColor: "var(--fc-border)" }}
          >
            <span className="text-2xl mb-1">👗</span>
            <span className="font-bold text-xs">Garments Template</span>
            <span className="text-[10px] text-dim mt-0.5">Sample CSV for apparel</span>
          </a>

          <a
            href="/api/admin/export?type=products"
            download
            className="p-4 rounded-2xl border flex flex-col items-center justify-center text-center hover:border-primary transition-all card-theme"
            style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}
          >
            <span className="text-2xl mb-1">📦</span>
            <span className="font-bold text-xs">Export All Products</span>
            <span className="text-[10px] text-dim mt-0.5">Catalog SKUs, prices &amp; stock</span>
          </a>

          <a
            href="/api/admin/export?type=orders"
            download
            className="p-4 rounded-2xl border flex flex-col items-center justify-center text-center hover:border-primary transition-all card-theme"
            style={{ backgroundColor: "var(--fc-bg)", borderColor: "var(--fc-border)" }}
          >
            <span className="text-2xl mb-1">📋</span>
            <span className="font-bold text-xs">Export All Orders</span>
            <span className="text-[10px] text-dim mt-0.5">Full customer orders &amp; status</span>
          </a>
        </div>
      </section>

      {/* 3. Transactional Email & Notifications Settings */}
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

      {/* 4. Payment Settings */}
      <section className="space-y-3">
        <div>
          <h2 className="font-display text-base font-bold">💳 Payment Methods &amp; UPI Configuration</h2>
          <p className="text-xs text-dim">Upload your shop UPI QR and toggle Cash on Delivery.</p>
        </div>
        <PaymentSettingsForm
          initial={{
            qrCodePath: paymentSettings?.qrCodePath ?? null,
            upiId: paymentSettings?.upiId ?? "",
            payeeName: paymentSettings?.payeeName ?? "Bablu Kumar",
            instructions: paymentSettings?.instructions ?? "",
            manualUpiEnabled: paymentSettings?.manualUpiEnabled ?? true,
            codEnabled: paymentSettings?.codEnabled ?? true,
            codFee: paymentSettings?.codFee ? Number(paymentSettings.codFee) : 0,
          }}
        />
      </section>

      {/* 5. Courier & Logistics Fulfillment Hub */}
      <section className="space-y-3">
        <LogisticsSettingsForm
          initialSettings={
            logisticsSettings
              ? {
                  provider: logisticsSettings.provider,
                  environment: logisticsSettings.environment,
                  apiEmail: logisticsSettings.apiEmail,
                  apiPassword: logisticsSettings.apiPassword,
                  autoFulfillEnabled: logisticsSettings.autoFulfillEnabled,
                  defaultGarmentWeight: Number(logisticsSettings.defaultGarmentWeight),
                  defaultJewelWeight: Number(logisticsSettings.defaultJewelWeight),
                }
              : null
          }
          initialPickup={pickupLocation}
        />
      </section>

      {/* 6. Delivery Settings */}
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

      {/* 6. Business Information */}
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
            gstin: businessSettings?.gstin && !businessSettings.gstin.startsWith("STORE_CTRL:") ? businessSettings.gstin : "",
            phone: businessSettings?.phone ?? "",
            email: businessSettings?.email ?? "",
          }}
        />
      </section>
    </div>
  );
}
