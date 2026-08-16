import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth/session";
import { z } from "zod";

const schema = z.object({
  defaultCharge: z.number().min(0),
  freeDeliveryAbove: z.number().min(0).optional().nullable(),
});

export async function GET() {
  const settings = await prisma.deliverySettings.findFirst();
  return NextResponse.json({ settings });
}

export async function PUT(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const existing = await prisma.deliverySettings.findFirst();
  const settings = existing
    ? await prisma.deliverySettings.update({ where: { id: existing.id }, data: parsed.data })
    : await prisma.deliverySettings.create({ data: parsed.data });

  return NextResponse.json({ settings });
}
