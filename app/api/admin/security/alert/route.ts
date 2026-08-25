import { NextRequest, NextResponse } from "next/server";
import { sendAdminAccessAttemptAlertEmail } from "@/lib/email/service";

import { rateLimit, clientKeyFromRequest } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    if (!rateLimit(clientKeyFromRequest(req, "sec-alert"), 3, 15 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many security alert reports" }, { status: 429 });
    }

    const body = await req.json().catch(() => null);
    const rawAttemptEmail = body?.attemptEmail;
    const attemptEmail = typeof rawAttemptEmail === "string" ? rawAttemptEmail.slice(0, 100).trim() : "Unknown Visitor";
    const userAgent = (req.headers.get("user-agent") || "").slice(0, 200);

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
