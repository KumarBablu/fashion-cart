import { NextResponse } from "next/server";
import { getStoresControl } from "@/lib/stores";

export const dynamic = "force-dynamic";

export async function GET() {
  const stores = await getStoresControl();
  return NextResponse.json(
    { stores },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    }
  );
}
