import { NextRequest, NextResponse } from "next/server";
import { getDb, prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth/session";
import { z } from "zod";

const schema = z.object({
  businessName: z.string().max(200).optional(),
  businessAddress: z.string().max(300).optional(),
  gstin: z.string().max(25).optional().transform((v) => (v && v.startsWith("STORE_CTRL:") ? "" : v)),
  phone: z.string().max(25).optional(),
  email: z.string().email().optional().or(z.literal("")),
});

export async function GET() {
  const rawSettings = await prisma.businessSettings.findFirst();
  const settings = rawSettings
    ? {
        ...rawSettings,
        gstin: rawSettings.gstin && !rawSettings.gstin.startsWith("STORE_CTRL:") ? rawSettings.gstin : "",
      }
    : null;
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

  const cleanData = {
    businessName: parsed.data.businessName || null,
    businessAddress: parsed.data.businessAddress || null,
    gstin: parsed.data.gstin && !parsed.data.gstin.startsWith("STORE_CTRL:") ? parsed.data.gstin : null,
    phone: parsed.data.phone || null,
    email: parsed.data.email || null,
  };

  // Sync to both store databases
  await Promise.all([
    (async () => {
      try {
        const db = getDb("garments");
        const existing = await db.businessSettings.findFirst();
        if (existing) {
          await db.businessSettings.update({ where: { id: existing.id }, data: cleanData });
        } else {
          await db.businessSettings.create({ data: cleanData });
        }
      } catch (e) {
        console.warn("Failed saving garments business settings", e);
      }
    })(),
    (async () => {
      try {
        const db = getDb("jewellery");
        const existing = await db.businessSettings.findFirst();
        if (existing) {
          await db.businessSettings.update({ where: { id: existing.id }, data: cleanData });
        } else {
          await db.businessSettings.create({ data: cleanData });
        }
      } catch (e) {
        console.warn("Failed saving jewellery business settings", e);
      }
    })(),
  ]);

  const settings = await prisma.businessSettings.findFirst();

  return NextResponse.json({ settings });
}
