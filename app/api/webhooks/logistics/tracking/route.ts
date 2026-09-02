import { NextRequest, NextResponse } from "next/server";
import { processLogisticsWebhook } from "@/lib/logistics/service";

export async function GET() {
  return NextResponse.json(
    { status: "ok", message: "Fashion Cart Logistics Webhook Receiver Active" },
    {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      },
    }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key",
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    // Shiprocket Test Ping handler
    if (!body || Object.keys(body).length === 0 || body.test || body.ping) {
      return NextResponse.json(
        { success: true, message: "Shiprocket Test Webhook Verified Successfully" },
        { status: 200 }
      );
    }

    // Shiprocket & Courier Webhook payload formats
    const awb = body.awb || body.awb_code || body.tracking_data?.awb_code || body.order_id;
    const eventStatus = body.current_status || body.status || body.tracking_data?.current_status;
    const location = body.location || body.scans?.[0]?.location || body.tracking_data?.location;
    const activity = body.activity || body.scans?.[0]?.activity || body.tracking_data?.status_description;

    if (!awb || !eventStatus) {
      return NextResponse.json(
        { success: true, message: "Payload received, acknowledged by receiver" },
        { status: 200 }
      );
    }

    const result = await processLogisticsWebhook(awb, eventStatus, location, activity, body);
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error("[LogisticsTrackingWebhook] Exception:", err);
    return NextResponse.json({ error: "Webhook processing error" }, { status: 500 });
  }
}
