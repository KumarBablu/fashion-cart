import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth/session";
import { sellerSchema } from "@/lib/validation/schemas";

export async function GET(_req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const sellers = await prisma.seller.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { products: true },
        },
        products: {
          select: {
            id: true,
            name: true,
            slug: true,
            brand: true,
            status: true,
          },
          take: 10,
        },
      },
    });

    return NextResponse.json({ sellers });
  } catch (error) {
    console.error("Error fetching sellers:", error);
    return NextResponse.json({ error: "Failed to fetch suppliers & sellers" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = sellerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const existing = await prisma.seller.findUnique({
      where: { sellerId: parsed.data.sellerId },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Seller ID "${parsed.data.sellerId}" is already registered.` },
        { status: 409 }
      );
    }

    const seller = await prisma.seller.create({
      data: {
        sellerId: parsed.data.sellerId,
        name: parsed.data.name,
        phone: parsed.data.phone || null,
        email: parsed.data.email || null,
        url: parsed.data.url || null,
        address: parsed.data.address || null,
        notes: parsed.data.notes || null,
        isActive: parsed.data.isActive ?? true,
      },
    });

    return NextResponse.json({ success: true, seller }, { status: 201 });
  } catch (error) {
    console.error("Error creating seller:", error);
    return NextResponse.json({ error: "Failed to create seller record" }, { status: 500 });
  }
}
