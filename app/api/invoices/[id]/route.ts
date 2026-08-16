import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";
import { getCurrentUser, getCurrentAdmin } from "@/lib/auth/session";
import { generateInvoiceForOrder } from "@/lib/invoice/generate";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    const admin = await getCurrentAdmin();

    // Look up order by id or orderNumber
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

    // Authorization check: if authenticated user is accessing, ensure ownership unless admin
    if (user && user.role !== "ADMIN" && order.userId !== user.id && !admin) {
      return new NextResponse("You are not authorized to view this invoice", {
        status: 403,
        headers: { "Content-Type": "text/plain" },
      });
    }

    // Generate or retrieve the PDF path
    const relativePath = await generateInvoiceForOrder(order.id);
    const fullPath = path.join(process.cwd(), "uploads", relativePath);
    const buffer = await readFile(fullPath);

    const filename = `Invoice-${order.orderNumber}.pdf`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
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
