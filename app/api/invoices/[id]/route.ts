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

    // Authorization check: if customer, must own the order. Otherwise admin allowed.
    if (!admin && (!user || (user.role !== "ADMIN" && order.userId !== user.id))) {
      return new NextResponse("You are not authorized to view this invoice", {
        status: 403,
        headers: { "Content-Type": "text/plain" },
      });
    }

    // Generate in-memory PDF buffer (zero disk write dependency for Vercel)
    const { buffer, invoiceNumber } = await generateInvoiceBufferForOrder(order.id);
    const filename = `Tax-Invoice-${order.orderNumber}-${invoiceNumber}.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
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
