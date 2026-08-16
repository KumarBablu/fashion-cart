import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatINR } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;

  const customers = await prisma.user.findMany({
    where: {
      role: "CUSTOMER",
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { phone: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      createdAt: true,
      _count: { select: { orders: true } },
      orders: { select: { total: true } },
    },
  });

  return (
    <div>
      <h1 className="font-display text-2xl">Customers</h1>

      <form className="mt-4" method="GET">
        <input name="q" defaultValue={q} placeholder="Search name, email, mobile…" className="rounded-md border border-line px-3 py-1.5 text-sm w-72" />
      </form>

      <div className="mt-6 overflow-x-auto rounded-lg border border-line bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-soft">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Mobile</th>
              <th className="px-4 py-3">Registered</th>
              <th className="px-4 py-3">Orders</th>
              <th className="px-4 py-3">Total Value</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3">
                  <Link href={`/admin/customers/${c.id}`} className="font-medium hover:text-marigold-deep">{c.name}</Link>
                </td>
                <td className="px-4 py-3 text-ink-soft">{c.email}</td>
                <td className="px-4 py-3 text-ink-soft">{c.phone ?? "—"}</td>
                <td className="px-4 py-3 text-ink-soft">{new Date(c.createdAt).toLocaleDateString("en-IN")}</td>
                <td className="px-4 py-3">{c._count.orders}</td>
                <td className="px-4 py-3">{formatINR(c.orders.reduce((s, o) => s + o.total.toNumber(), 0))}</td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-ink-soft">No customers found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
