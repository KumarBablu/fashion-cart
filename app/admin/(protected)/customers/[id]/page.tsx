import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import CustomerDetailManager from "@/components/admin/CustomerDetailManager";

export const dynamic = "force-dynamic";

export default async function AdminCustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const selectUser = {
    id: true,
    name: true,
    email: true,
    phone: true,
    role: true,
    createdAt: true,
    isActive: true,
    addresses: {
      select: {
        id: true,
        fullName: true,
        mobileNumber: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        pinCode: true,
        isDefault: true,
      },
    },
    orders: {
      orderBy: { createdAt: "desc" as const },
      include: { payment: true, items: true },
    },
    reviews: {
      orderBy: { createdAt: "desc" as const },
      include: { product: { select: { name: true, slug: true } } },
    },
  };

  const [garmentsUser, jewelleryUser] = await Promise.all([
    getDb("garments").user.findFirst({
      where: { OR: [{ id }, { email: id }] },
      select: selectUser,
    }).catch(() => null),
    getDb("jewellery").user.findFirst({
      where: { OR: [{ id }, { email: id }] },
      select: selectUser,
    }).catch(() => null),
  ]);

  const customer = garmentsUser || jewelleryUser;
  if (!customer) notFound();

  // Combine orders and reviews across both stores
  const allOrders = [...(garmentsUser?.orders || []), ...(jewelleryUser?.orders || [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const allReviews = [...(garmentsUser?.reviews || []), ...(jewelleryUser?.reviews || [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <CustomerDetailManager
      customer={{
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        role: customer.role,
        createdAt: customer.createdAt.toISOString(),
        isActive: customer.isActive,
        addresses: customer.addresses,
        orders: allOrders.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          status: o.status,
          total: Number(o.total),
          createdAt: o.createdAt.toISOString(),
          payment: o.payment ? { method: o.payment.method, status: o.payment.status } : null,
          items: o.items,
        })),
        reviews: allReviews.map((r) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          createdAt: r.createdAt.toISOString(),
          product: r.product,
        })),
      }}
    />
  );
}

