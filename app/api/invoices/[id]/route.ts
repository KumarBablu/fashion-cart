import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, getCurrentAdmin } from "@/lib/auth/session";
import { generateInvoiceBufferForOrder } from "@/lib/invoice/generate";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    const admin = await getCurrentAdmin();

    // Look up order by id, orderNumber, or invoiceNumber
    const order = await prisma.order.findFirst({
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
      return new NextResponse("Order or Invoice not found", {
        status: 404,
        headers: { "Content-Type": "text/plain" },
      });
    }

    // Authorization check: if logged in as another user, block. Otherwise allow direct order invoice download.
    if (user && user.role !== "ADMIN" && order.userId !== user.id && !admin) {
      return new NextResponse("You are not authorized to view this invoice", {
        status: 403,
        headers: { "Content-Type": "text/plain" },
      });
    }

    // Generate in-memory PDF buffer with standalone zero-fs PDFKit
    const { buffer } = await generateInvoiceBufferForOrder(order.id);
    const rawCustomerName = (order.shippingAddressSnapshot as any)?.fullName || order.user.name || "Customer";
    const cleanCustomerName = rawCustomerName.trim().replace(/[^a-zA-Z0-9]/g, "-").replace(/-+/g, "-").toUpperCase();
    const filename = `FashionCart-Tax-Invoice-${order.orderNumber}-${cleanCustomerName}.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (err) {
    console.error("Error serving invoice PDF:", err);
    return new NextResponse("Internal Server Error generating invoice PDF", {
      status: 500,
      headers: { "Content-Type": "text/plain" },
    });
  }
}
