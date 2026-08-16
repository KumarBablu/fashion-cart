import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { z } from "zod";

const schema = z.object({
  code: z.string().min(1),
  subtotal: z.number().positive(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Please log in to apply promo coupons." }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid coupon code request" }, { status: 400 });
    }

    const { code, subtotal } = parsed.data;

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase().trim() },
    });

    if (!coupon || !coupon.isActive) {
      return NextResponse.json({ error: "Invalid or expired coupon code." }, { status: 404 });
    }

    if (coupon.endDate && new Date(coupon.endDate) < new Date()) {
      return NextResponse.json({ error: "This coupon code has expired." }, { status: 400 });
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return NextResponse.json({ error: "Coupon code usage limit has been reached." }, { status: 400 });
    }

    if (coupon.minOrderAmount && subtotal < Number(coupon.minOrderAmount)) {
      return NextResponse.json(
        { error: `Minimum order subtotal of ₹${coupon.minOrderAmount} required for this coupon.` },
        { status: 400 }
      );
    }

    let discountAmount = 0;
    if (coupon.discountType === "PERCENTAGE") {
      discountAmount = (subtotal * Number(coupon.discountValue)) / 100;
      if (coupon.maxDiscountAmount && discountAmount > Number(coupon.maxDiscountAmount)) {
        discountAmount = Number(coupon.maxDiscountAmount);
      }
    } else {
      discountAmount = Number(coupon.discountValue);
    }

    // Ensure discount does not exceed subtotal
    discountAmount = Math.min(subtotal, Math.round(discountAmount * 100) / 100);

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: Number(coupon.discountValue),
        discountAmount,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
