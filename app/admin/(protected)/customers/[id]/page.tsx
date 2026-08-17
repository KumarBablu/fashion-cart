import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import CustomerDetailManager from "@/components/admin/CustomerDetailManager";

export const dynamic = "force-dynamic";

export default async function AdminCustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const customer = await prisma.user.findUnique({
    where: { id },
    select: {
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
        orderBy: { createdAt: "desc" },
        include: { payment: true, items: true },
      },
      reviews: {
        orderBy: { createdAt: "desc" },
        include: { product: { select: { name: true, slug: true } } },
      },
    },
  });

  if (!customer) notFound();

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
        orders: customer.orders.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          status: o.status,
          total: Number(o.total),
          createdAt: o.createdAt.toISOString(),
          payment: o.payment ? { method: o.payment.method, status: o.payment.status } : null,
          items: o.items,
        })),
        reviews: customer.reviews.map((r) => ({
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

