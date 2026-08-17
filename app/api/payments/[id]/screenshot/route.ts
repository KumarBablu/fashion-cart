import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { saveImageUpload, UploadError } from "@/lib/upload";
import { utrSubmissionSchema } from "@/lib/validation/schemas";

/**
 * Customer submits a payment screenshot + UTR number.
 *
 * SECURITY: This action NEVER marks the order/payment as paid. It only
 * moves the payment into UNDER_REVIEW. Only an admin approving the
 * payment (see /api/admin/payments/[id]/approve) can mark it VERIFIED
 * and confirm the order. See requirement "IMPORTANT PAYMENT SECURITY RULE".
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const payment = await prisma.payment.findFirst({
    where: { id, order: { userId: user.id } },
    include: { order: true },
  });

  if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });

  if (payment.status === "VERIFIED") {
    return NextResponse.json({ error: "This payment has already been verified." }, { status: 400 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  const utrNumber = formData.get("utrNumber");

  const parsedUtr = utrSubmissionSchema.safeParse({ utrNumber });
  if (!parsedUtr.success) {
    return NextResponse.json({ error: parsedUtr.error.issues[0]?.message }, { status: 400 });
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Please upload a payment screenshot." }, { status: 400 });
  }

  // Prevent duplicate UTR numbers being used across different payments.
  const duplicateUtr = await prisma.payment.findFirst({
    where: { utrNumber: parsedUtr.data.utrNumber, id: { not: payment.id } },
  });
  if (duplicateUtr) {
    return NextResponse.json(
      { error: "This UTR / transaction number has already been submitted for another order." },
      { status: 409 }
    );
  }

  try {
    const { relativePath } = await saveImageUpload(file, "payments");
    const screenshotPath = relativePath.startsWith("data:") ? relativePath : `/uploads/${relativePath}`;

    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        screenshotPath,
        utrNumber: parsedUtr.data.utrNumber,
        status: "UNDER_REVIEW",
        submittedAt: new Date(),
        rejectionReason: null,
      },
    });

    await prisma.order.update({
      where: { id: payment.orderId },
      data: { status: "PAYMENT_REVIEW" },
    });

    return NextResponse.json({ payment: updated });
  } catch (err) {
    if (err instanceof UploadError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}
