import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { saveImageUpload, UploadError } from "@/lib/upload";
import { sendPaymentProofSubmittedAdminAlert } from "@/lib/email/service";

/**
 * Customer submits a payment screenshot + UTR number across Garments or Jewellery database.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  let store: "garments" | "jewellery" = "garments";
  let payment = await getDb("garments").payment.findFirst({
    where: { id, order: { userId: user.id } },
    include: { order: true },
  });

  if (!payment) {
    payment = await getDb("jewellery").payment.findFirst({
      where: { id, order: { userId: user.id } },
      include: { order: true },
    });
    if (payment) {
      store = "jewellery";
    }
  }

  if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });

  if (payment.status === "VERIFIED") {
    return NextResponse.json({ error: "This payment has already been verified." }, { status: 400 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  const utrNumber = formData.get("utrNumber");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Please upload a payment screenshot." }, { status: 400 });
  }

  const rawUtr = typeof utrNumber === "string" && utrNumber.trim().length > 0 ? utrNumber.trim() : null;
  const db = getDb(store);

  // Prevent duplicate UTR numbers being used across different payments if provided.
  if (rawUtr) {
    const duplicateUtr = await db.payment.findFirst({
      where: { utrNumber: rawUtr, id: { not: payment.id } },
    });
    if (duplicateUtr) {
      return NextResponse.json(
        { error: "This UTR / transaction number has already been submitted for another order." },
        { status: 409 }
      );
    }
  }

  try {
    const { relativePath } = await saveImageUpload(file, "payments");
    const screenshotPath = relativePath.startsWith("data:") ? relativePath : `/uploads/${relativePath}`;

    const updated = await db.payment.update({
      where: { id: payment.id },
      data: {
        screenshotPath,
        utrNumber: rawUtr,
        status: "UNDER_REVIEW",
        submittedAt: new Date(),
        rejectionReason: null,
      },
    });

    await db.order.update({
      where: { id: payment.orderId },
      data: { status: "PAYMENT_REVIEW" },
    });

    // Clear the cart now that customer has officially submitted payment proof
    const userCart = await db.cart.findUnique({ where: { userId: user.id } });
    if (userCart) {
      await db.cartItem.deleteMany({ where: { cartId: userCart.id } }).catch(() => null);
    }

    // Alert admin of newly submitted payment proof
    sendPaymentProofSubmittedAdminAlert(payment.order, rawUtr || "Screenshot Verification").catch(() => null);

    return NextResponse.json({ payment: updated });
  } catch (err) {
    if (err instanceof UploadError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}
