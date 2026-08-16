import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth/session";
import { z } from "zod";

const createCouponSchema = z.object({
  code: z.string().trim().min(2).max(20).toUpperCase(),
  description: z.string().optional(),
  discountType: z.enum(["PERCENTAGE", "FIXED"]).default("PERCENTAGE"),
  discountValue: z.number().positive(),
  minOrderAmount: z.number().positive().optional().nullable(),
  maxDiscountAmount: z.number().positive().optional().nullable(),
  usageLimit: z.number().int().positive().optional().nullable(),
  endDate: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { orders: true } } },
  });

  return NextResponse.json({ coupons });
}

export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createCouponSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid coupon data" }, { status: 400 });
  }

  const { code, description, discountType, discountValue, minOrderAmount, maxDiscountAmount, usageLimit, endDate, isActive } = parsed.data;

  const existing = await prisma.coupon.findUnique({ where: { code } });
  if (existing) {
    return NextResponse.json({ error: "A coupon with this code already exists." }, { status: 400 });
  }

  const coupon = await prisma.coupon.create({
    data: {
      code,
      description: description || null,
      discountType,
      discountValue,
      minOrderAmount: minOrderAmount ? minOrderAmount : null,
      maxDiscountAmount: maxDiscountAmount ? maxDiscountAmount : null,
      usageLimit: usageLimit ? usageLimit : null,
      endDate: endDate ? new Date(endDate) : null,
      isActive,
    },
  });

  return NextResponse.json({ coupon }, { status: 201 });
}
