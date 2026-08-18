import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const now = new Date();
    const coupons = await prisma.coupon.findMany({
      where: {
        isActive: true,
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
      select: {
        id: true,
        code: true,
        description: true,
        discountType: true,
        discountValue: true,
        minOrderAmount: true,
        maxDiscountAmount: true,
        endDate: true,
      },
      orderBy: { discountValue: "desc" },
    });

    const formatted = coupons.map((c) => ({
      id: c.id,
      code: c.code,
      description: c.description,
      discountType: c.discountType,
      discountValue: Number(c.discountValue),
      minOrderAmount: c.minOrderAmount ? Number(c.minOrderAmount) : 0,
      maxDiscountAmount: c.maxDiscountAmount ? Number(c.maxDiscountAmount) : null,
      endDate: c.endDate ? c.endDate.toISOString().split("T")[0] : null,
    }));

    return NextResponse.json({ coupons: formatted });
  } catch (err) {
    console.error("Fetch active coupons error:", err);
    return NextResponse.json({ coupons: [] });
  }
}
