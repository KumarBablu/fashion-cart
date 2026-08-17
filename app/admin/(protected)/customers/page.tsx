import { prisma } from "@/lib/db";
import CustomersManager, { CustomerItem } from "@/components/admin/CustomersManager";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
      isActive: true,
      _count: { select: { orders: true } },
      orders: { select: { total: true } },
    },
  });

  const formatted: CustomerItem[] = users.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    role: c.role,
    registrationDate: c.createdAt.toISOString(),
    isActive: c.isActive,
    numberOfOrders: c._count.orders,
    totalOrdersValue: c.orders.reduce((s, o) => s + Number(o.total), 0),
  }));

  return <CustomersManager initialCustomers={formatted} />;
}

