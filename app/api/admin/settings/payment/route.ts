import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth/session";
import { saveImageUpload, UploadError } from "@/lib/upload";

// Public read: checkout page needs the active QR to display to customers.
export async function GET() {
  const settings = await prisma.paymentSettings.findFirst({ where: { isActive: true } });
  return NextResponse.json({ settings });
}

export async function POST(req: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("qrCode");
    const upiId = formData.get("upiId");
    const payeeName = formData.get("payeeName");
    const instructions = formData.get("instructions");
    const manualUpiEnabled = formData.get("manualUpiEnabled") !== "false";
    const codEnabled = formData.get("codEnabled") === "true";
    const codFee = Number(formData.get("codFee") || 0);

    let qrCodePath: string | undefined;
    if (file instanceof File && file.size > 0) {
      try {
        const { relativePath } = await saveImageUpload(file, "payments");
        qrCodePath = relativePath.startsWith("data:") ? relativePath : `/uploads/${relativePath}`;
      } catch (err) {
        if (err instanceof UploadError) {
          return NextResponse.json({ error: err.message }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to process QR image: " + (err as Error)?.message }, { status: 400 });
      }
    }

    const existing = await prisma.paymentSettings.findFirst({ where: { isActive: true } });

    const settings = existing
      ? await prisma.paymentSettings.update({
          where: { id: existing.id },
          data: {
            ...(qrCodePath ? { qrCodePath } : {}),
            upiId: typeof upiId === "string" ? upiId : existing.upiId,
            payeeName: typeof payeeName === "string" ? payeeName : existing.payeeName,
            instructions: typeof instructions === "string" ? instructions : existing.instructions,
            manualUpiEnabled,
            codEnabled,
            codFee,
          },
        })
      : await prisma.paymentSettings.create({
          data: {
            qrCodePath,
            upiId: typeof upiId === "string" ? upiId : undefined,
            payeeName: typeof payeeName === "string" ? payeeName : "Bablu Kumar",
            instructions: typeof instructions === "string" ? instructions : undefined,
            manualUpiEnabled,
            codEnabled,
            codFee,
            isActive: true,
          },
        });

    // Also sync to jewellery DB if configured
    try {
      const { getDb } = await import("@/lib/db");
      const jwDb = getDb("jewellery");
      const jwExisting = await jwDb.paymentSettings.findFirst({ where: { isActive: true } }).catch(() => null);
      if (jwExisting) {
        await jwDb.paymentSettings.update({
          where: { id: jwExisting.id },
          data: {
            ...(qrCodePath ? { qrCodePath } : {}),
            upiId: typeof upiId === "string" ? upiId : jwExisting.upiId,
            payeeName: typeof payeeName === "string" ? payeeName : jwExisting.payeeName,
            instructions: typeof instructions === "string" ? instructions : jwExisting.instructions,
            manualUpiEnabled,
            codEnabled,
            codFee,
          },
        });
      } else {
        await jwDb.paymentSettings.create({
          data: {
            qrCodePath,
            upiId: typeof upiId === "string" ? upiId : undefined,
            payeeName: typeof payeeName === "string" ? payeeName : "Bablu Kumar",
            instructions: typeof instructions === "string" ? instructions : undefined,
            manualUpiEnabled,
            codEnabled,
            codFee,
            isActive: true,
          },
        });
      }
    } catch {
      // Non-blocking sync
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Payment settings error:", error);
    return NextResponse.json(
      { error: "Failed to save payment settings. " + (error as Error)?.message },
      { status: 500 }
    );
  }
}
