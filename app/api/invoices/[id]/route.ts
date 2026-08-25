import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, getCurrentAdmin } from "@/lib/auth/session";
import { generateInvoiceBufferForOrder } from "@/lib/invoice/generate";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    const admin = await getCurrentAdmin();

    // Look up order by id, orderNumber, or invoiceNumber in garments or jewellery DB
    const { getDb } = await import("@/lib/db");
    let order = await getDb("garments").order.findFirst({
      where: {
        OR: [
          { id },
          { orderNumber: id },
          { invoice: { invoiceNumber: id } },
        ],
      },
      include: { payment: true, user: true, invoice: true },
    });

    if (!order) {
      order = await getDb("jewellery").order.findFirst({
        where: {
          OR: [
            { id },
            { orderNumber: id },
            { invoice: { invoiceNumber: id } },
          ],
        },
        include: { payment: true, user: true, invoice: true },
      });
    }

    if (!order) {
      return new NextResponse("Order or Invoice not found", {
        status: 404,
        headers: { "Content-Type": "text/plain" },
      });
    }

    // Authorization check: User must be authenticated as the order owner or admin,
    // or provide a valid cryptographic verification token (e.g. from printed QR code).
    const sigToken = req.nextUrl.searchParams.get("token") || req.nextUrl.searchParams.get("sig");
    let isSignatureValid = false;

    if (sigToken) {
      const crypto = await import("crypto");
      const secret = process.env.SESSION_SECRET || "fashion-cart-invoice-auth-secret";
      const expectedSig = crypto.createHmac("sha256", secret).update(`${order.id}:${order.orderNumber}`).digest("hex");
      const sigBuf = Buffer.from(sigToken, "utf-8");
      const expBuf = Buffer.from(expectedSig, "utf-8");
      if (sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf)) {
        isSignatureValid = true;
      }
    }

    const isOwner = user && user.id === order.userId;
    const isAuthorizedAdmin = (user && user.role === "ADMIN") || Boolean(admin);

    if (!isOwner && !isAuthorizedAdmin && !isSignatureValid) {
      return new NextResponse("You are not authorized to view this invoice. Please log in to your account.", {
        status: 403,
        headers: { "Content-Type": "text/plain" },
      });
    }

    // Generate in-memory PDF buffer with zero-dependency pdf-lib
    const { buffer } = await generateInvoiceBufferForOrder(order.id);
    const rawCustomerName = (order.shippingAddressSnapshot as any)?.fullName || order.user.name || "Customer";
    const cleanCustomerName = rawCustomerName.trim().replace(/[^a-zA-Z0-9]/g, "-").replace(/-+/g, "-").toUpperCase();
    const filename = `FashionCart-Tax-Invoice-${order.orderNumber}-${cleanCustomerName}.pdf`;

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (err) {
    console.error("Error serving invoice PDF:", err);
    return new Response("Internal Server Error generating invoice PDF", {
      status: 500,
      headers: { "Content-Type": "text/plain" },
    });
  }
}
