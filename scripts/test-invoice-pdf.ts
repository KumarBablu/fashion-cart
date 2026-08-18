import { generateInvoiceBufferForOrder } from "../lib/invoice/generate";
import { prisma } from "../lib/db";
import fs from "fs";
import path from "path";

async function testInvoicePdf() {
  console.log("=== TESTING PDF INVOICE GENERATION WITH QR CODE ===");

  const order = await prisma.order.findFirst({
    include: { items: true },
  });

  if (!order) {
    console.log("No orders found to test.");
    return;
  }

  const { buffer, invoiceNumber, orderNumber } = await generateInvoiceBufferForOrder(order.id);
  console.log(`Generated PDF for ${orderNumber} -> ${invoiceNumber}, size: ${buffer.length} bytes`);

  const outDir = path.join(process.cwd(), "uploads", "invoices");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const outPath = path.join(outDir, `test-${invoiceNumber}.pdf`);
  fs.writeFileSync(outPath, buffer);
  console.log(`✅ Saved test PDF invoice to ${outPath}`);
}

testInvoicePdf()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
