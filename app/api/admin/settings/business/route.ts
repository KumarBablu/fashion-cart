import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth/session";
import { z } from "zod";

const schema = z.object({
  businessName: z.string().max(200).optional(),
  businessAddress: z.string().max(300).optional(),
  gstin: z.string().max(20).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional().or(z.literal("")),
});

export async function GET() {
  const settings = await prisma.businessSettings.findFirst();
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

  const existing = await prisma.businessSettings.findFirst();
  const settings = existing
    ? await prisma.businessSettings.update({ where: { id: existing.id }, data: parsed.data })
    : await prisma.businessSettings.create({ data: parsed.data });

  return NextResponse.json({ settings });
}
