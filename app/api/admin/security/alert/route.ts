import { NextRequest, NextResponse } from "next/server";
import { sendAdminAccessAttemptAlertEmail } from "@/lib/email/service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const attemptEmail = body?.attemptEmail || "Unknown Visitor";
    const userAgent = req.headers.get("user-agent");

    await sendAdminAccessAttemptAlertEmail({
      attemptEmail,
      userAgent,
    });

    return NextResponse.json({ success: true, message: "Security alert logged and dispatched." });
  } catch (err) {
    console.error("Security alert dispatch error:", err);
    return NextResponse.json({ error: "Failed to dispatch security alert" }, { status: 500 });
  }
}
