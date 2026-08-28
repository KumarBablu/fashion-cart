import { NextRequest, NextResponse } from "next/server";
import { prisma, getDb } from "@/lib/db";
import { getCurrentUser, getStoreUser } from "@/lib/auth/session";
import { addressSchema } from "@/lib/validation/schemas";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const jwUser = await getStoreUser("jewellery");

  const [garmentsAddresses, jewelleryAddresses] = await Promise.all([
    prisma.address.findMany({
      where: { user: { email: user.email } },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    }),
    getDb("jewellery").address.findMany({
      where: { user: { email: user.email } },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    }).catch(() => []),
  ]);

  // Combine unique addresses by ID or address lines
  const seenIds = new Set<string>();
  const allAddresses = [];
  for (const addr of [...garmentsAddresses, ...jewelleryAddresses]) {
    if (!seenIds.has(addr.id)) {
      seenIds.add(addr.id);
      allAddresses.push(addr);
    }
  }

  return NextResponse.json({ addresses: allAddresses });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = addressSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  // Ensure user account exists in jewellery database
  const jwUser = await getStoreUser("jewellery");

  const address = await prisma.$transaction(async (tx) => {
    if (parsed.data.isDefault) {
      await tx.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
    }
    // First address for a user is automatically the default.
    const count = await tx.address.count({ where: { userId: user.id } });
    return tx.address.create({
      data: { ...parsed.data, userId: user.id, isDefault: parsed.data.isDefault || count === 0 },
    });
  });

  // Mirror address into Jewellery DB so foreign key relations on Orders never fail
  if (jwUser) {
    try {
      const jwDb = getDb("jewellery");
      if (parsed.data.isDefault) {
        await jwDb.address.updateMany({ where: { userId: jwUser.id }, data: { isDefault: false } }).catch(() => {});
      }
      await jwDb.address.upsert({
        where: { id: address.id },
        update: { ...parsed.data, userId: jwUser.id, isDefault: address.isDefault },
        create: { ...parsed.data, id: address.id, userId: jwUser.id, isDefault: address.isDefault },
      });
    } catch (err) {
      console.error("Address sync to jewellery db failed:", err);
    }
  }

  return NextResponse.json({ address }, { status: 201 });
}
