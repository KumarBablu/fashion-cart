import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { sendAccountDeletedEmail } from "@/lib/email/service";
import { z } from "zod";

const updateCustomerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").optional(),
  email: z.string().trim().email("Invalid email address").optional(),
  phone: z.string().trim().optional().nullable(),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  role: z.enum(["CUSTOMER", "ADMIN"]).optional(),
  isActive: z.boolean().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
      addresses: true,
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

  if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  return NextResponse.json({ customer });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = updateCustomerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // If email is changing, check uniqueness
  if (parsed.data.email && parsed.data.email.toLowerCase() !== target.email.toLowerCase()) {
    const existing = await prisma.user.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
    });
    if (existing) {
      return NextResponse.json({ error: "That email is already registered to another account." }, { status: 409 });
    }
  }

  const updateData: {
    name?: string;
    email?: string;
    phone?: string | null;
    passwordHash?: string;
    role?: "CUSTOMER" | "ADMIN";
    isActive?: boolean;
  } = {};

  if (parsed.data.name) updateData.name = parsed.data.name;
  if (parsed.data.email) updateData.email = parsed.data.email.toLowerCase();
  if (parsed.data.phone !== undefined) updateData.phone = parsed.data.phone ? parsed.data.phone : null;
  if (parsed.data.role) updateData.role = parsed.data.role;
  if (parsed.data.isActive !== undefined) updateData.isActive = parsed.data.isActive;
  if (parsed.data.password) {
    updateData.passwordHash = await hashPassword(parsed.data.password);
  }

  const updated = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ customer: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Safeguard: Cannot delete own admin account
  if (admin.id === id) {
    return NextResponse.json({ error: "You cannot delete your own logged-in administrator account." }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { id },
    include: { orders: true },
  });

  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Delete cart items, wishlist, and reviews
  const cart = await prisma.cart.findUnique({ where: { userId: id } });
  if (cart) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    await prisma.cart.delete({ where: { id: cart.id } });
  }

  await prisma.wishlist.deleteMany({ where: { userId: id } });
  await prisma.review.deleteMany({ where: { userId: id } });
  await prisma.address.deleteMany({ where: { userId: id } });

  // If user has orders, we can safely delete user or nullify if schema allows
  // In our schema, Order has `userId String`, so if orders exist, we delete orders or delete user
  if (target.orders.length > 0) {
    for (const order of target.orders) {
      await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
      await prisma.payment.deleteMany({ where: { orderId: order.id } });
      await prisma.invoice.deleteMany({ where: { orderId: order.id } });
      await prisma.order.delete({ where: { id: order.id } });
    }
  }

  // Send Account Deletion Confirmation Email
  await sendAccountDeletedEmail({
    name: target.name,
    email: target.email,
  }).catch((err) => {
    console.error("Account deletion email dispatch failed:", err);
  });

  await prisma.user.delete({ where: { id } });

  return NextResponse.json({ success: true, message: `Account for ${target.name} (${target.email}) deleted.` });
}
