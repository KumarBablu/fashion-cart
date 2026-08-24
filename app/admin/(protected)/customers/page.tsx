import { getDb } from "@/lib/db";
import CustomersManager, { CustomerItem } from "@/components/admin/CustomersManager";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  const selectQuery = {
    id: true,
    name: true,
    email: true,
    phone: true,
    role: true,
    createdAt: true,
    isActive: true,
    _count: { select: { orders: true } },
    orders: { select: { total: true } },
  };

  const [garmentsUsers, jewelleryUsers] = await Promise.all([
    getDb("garments").user.findMany({
      orderBy: { createdAt: "desc" },
      select: selectQuery,
    }).catch(() => []),
    getDb("jewellery").user.findMany({
      orderBy: { createdAt: "desc" },
      select: selectQuery,
    }).catch(() => []),
  ]);

  // Merge unique users by email or ID
  const userMap = new Map<string, typeof garmentsUsers[0]>();

  for (const u of garmentsUsers) {
    userMap.set(u.email.toLowerCase(), u);
  }

  for (const u of jewelleryUsers) {
    const key = u.email.toLowerCase();
    const existing = userMap.get(key);
    if (existing) {
      userMap.set(key, {
        ...existing,
        _count: { orders: existing._count.orders + u._count.orders },
        orders: [...existing.orders, ...u.orders],
      });
    } else {
      userMap.set(key, u);
    }
  }

  const allUsers = Array.from(userMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const formatted: CustomerItem[] = allUsers.map((c) => ({
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

