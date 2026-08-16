import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { addressSchema } from "@/lib/validation/schemas";

async function assertOwnership(userId: string, id: string) {
  const address = await prisma.address.findUnique({ where: { id } });
  if (!address || address.userId !== userId) return null;
  return address;
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const owned = await assertOwnership(user.id, id);
  if (!owned) return NextResponse.json({ error: "Address not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = addressSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const address = await prisma.$transaction(async (tx) => {
    if (parsed.data.isDefault) {
      await tx.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
    }
    return tx.address.update({ where: { id }, data: parsed.data });
  });

  return NextResponse.json({ address });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const owned = await assertOwnership(user.id, id);
  if (!owned) return NextResponse.json({ error: "Address not found" }, { status: 404 });

  await prisma.address.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
