import { NextRequest, NextResponse } from "next/server";
import { processLogisticsWebhook } from "@/lib/logistics/service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    // Shiprocket Webhook payload formats
    const awb = body.awb || body.awb_code || body.tracking_data?.awb_code || body.order_id;
    const eventStatus = body.current_status || body.status || body.tracking_data?.current_status;
    const location = body.location || body.scans?.[0]?.location || body.tracking_data?.location;
    const activity = body.activity || body.scans?.[0]?.activity || body.tracking_data?.status_description;

    if (!awb || !eventStatus) {
      return NextResponse.json({ message: "Payload received, but missing awb or status" }, { status: 200 });
    }

    const result = await processLogisticsWebhook(awb, eventStatus, location, activity, body);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[ShiprocketWebhook] Exception:", err);
    return NextResponse.json({ error: "Webhook processing error" }, { status: 500 });
  }
}
