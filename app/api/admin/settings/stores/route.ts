import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth/session";
import { getStoresControl, saveStoresControl } from "@/lib/stores";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  const stores = await getStoresControl();
  return NextResponse.json({ stores });
}

export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const updated = await saveStoresControl(body);

  return NextResponse.json({
    success: true,
    message: "Store availability settings updated successfully.",
    stores: updated,
  });
}
