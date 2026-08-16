import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth/session";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const customer = await prisma.user.findUnique({
    where: { id, role: "CUSTOMER" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      createdAt: true,
      isActive: true,
      addresses: true,
      orders: { orderBy: { createdAt: "desc" }, include: { payment: true, items: true } },
    },
  });

  if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  return NextResponse.json({ customer });
}
