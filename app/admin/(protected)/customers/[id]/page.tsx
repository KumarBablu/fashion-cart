import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatINR } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminCustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const customer = await prisma.user.findUnique({
    where: { id, role: "CUSTOMER" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      createdAt: true,
      addresses: true,
      orders: { orderBy: { createdAt: "desc" }, include: { payment: true } },
    },
  });

  if (!customer) notFound();

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl">{customer.name}</h1>
      <p className="text-sm text-ink-soft mt-1">{customer.email} · {customer.phone ?? "No phone on file"}</p>
      <p className="text-xs text-ink-soft mt-1">
        Registered {new Date(customer.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
      </p>

      <div className="mt-6 rounded-lg border border-line bg-white p-5">
        <h2 className="text-sm font-semibold">Addresses</h2>
        {customer.addresses.length === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">No saved addresses.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {customer.addresses.map((a) => (
              <p key={a.id} className="text-sm text-ink-soft">
                {a.fullName} — {a.addressLine1}, {a.city}, {a.state} - {a.pinCode}
              </p>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 rounded-lg border border-line bg-white p-5">
        <h2 className="text-sm font-semibold">Order history</h2>
        <div className="mt-3 divide-y divide-line">
          {customer.orders.map((o) => (
            <Link key={o.id} href={`/admin/orders/${o.id}`} className="flex justify-between py-2.5 text-sm hover:text-marigold-deep">
              <span>{o.orderNumber} · {o.status.replace(/_/g, " ")}</span>
              <span>{formatINR(o.total)}</span>
            </Link>
          ))}
          {customer.orders.length === 0 && <p className="py-3 text-sm text-ink-soft">No orders yet.</p>}
        </div>
      </div>
    </div>
  );
}
