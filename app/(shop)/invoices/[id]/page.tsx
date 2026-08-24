import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser, getCurrentAdmin } from "@/lib/auth/session";
import InvoiceDocument from "@/components/invoice/InvoiceDocument";
import ParcelShippingLabel from "@/components/invoice/ParcelShippingLabel";
import InvoiceViewTabs from "@/components/invoice/InvoiceViewTabs";

export const dynamic = "force-dynamic";

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const admin = await getCurrentAdmin();

  // Find order in garments or jewellery DB
  const { getDb } = await import("@/lib/db");
  let store: "garments" | "jewellery" = "garments";
  let order = await getDb("garments").order.findFirst({
    where: {
      OR: [
        { id },
        { orderNumber: id },
        { invoice: { invoiceNumber: id } },
      ],
    },
    include: {
      items: true,
      user: { select: { name: true, email: true, phone: true } },
      payment: true,
      invoice: true,
    },
  });

  if (!order) {
    order = await getDb("jewellery").order.findFirst({
      where: {
        OR: [
          { id },
          { orderNumber: id },
          { invoice: { invoiceNumber: id } },
        ],
      },
      include: {
        items: true,
        user: { select: { name: true, email: true, phone: true } },
        payment: true,
        invoice: true,
      },
    });
    if (order) store = "jewellery";
  }

  if (!order) notFound();

  // Check customer or admin authorization
  if (!admin && (!user || (user.role !== "ADMIN" && order.userId !== user.id))) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center p-8 max-w-md rounded-2xl border bg-white shadow-md">
          <p className="text-4xl mb-2">🔒</p>
          <h1 className="text-lg font-bold text-slate-800">Authentication Required</h1>
          <p className="text-xs text-slate-500 mt-1">Please sign in to view this official order invoice.</p>
          <Link
            href={`/login?next=/invoices/${id}`}
            className="mt-4 inline-block px-5 py-2 rounded-full font-bold text-xs uppercase bg-[#0C3B2E] text-white"
          >
            Sign In Now →
          </Link>
        </div>
      </div>
    );
  }

  const business = await getDb(store).businessSettings.findFirst();
  const isUserAdmin = Boolean(admin || (user && user.role === "ADMIN"));

  return (
    <div className="min-h-screen bg-[#FAF8F5] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation & Tab Switcher (Screen Only) */}
        <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
          <Link
            href={isUserAdmin ? `/admin/orders/${order.id}` : `/account/orders/${order.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0C3B2E] hover:underline"
          >
            <span>←</span> Back to Order Details
          </Link>
        </div>

        {/* Invoice View (Tabs only for Admin) */}
        <InvoiceViewTabs
          order={order as any}
          business={business}
          isAdmin={isUserAdmin}
        />
      </div>
    </div>
  );
}
