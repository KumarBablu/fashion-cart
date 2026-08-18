import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { prisma } from "@/lib/db";
import { generateInvoiceNumber } from "@/lib/order-number";
import { getBarcodeBars } from "./barcode";

/**
 * Generates an in-memory GST-compliant PDF invoice buffer for an order using pdf-lib.
 * 100% web-standards, zero-filesystem dependencies, perfectly compatible with Vercel serverless.
 */
export async function generateInvoiceBufferForOrder(orderId: string): Promise<{
  buffer: Buffer;
  invoiceNumber: string;
  orderNumber: string;
}> {
  const existing = await prisma.invoice.findUnique({ where: { orderId } });
  const invoiceNumber = existing?.invoiceNumber ?? (await generateInvoiceNumber());

  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { items: true, user: true, payment: true },
  });

  const business = await prisma.businessSettings.findFirst();

  // Create invoice record in database if not yet present
  if (!existing) {
    await prisma.invoice
      .create({
        data: {
          orderId,
          invoiceNumber,
          pdfPath: `invoices/${invoiceNumber}.pdf`,
        },
      })
      .catch(() => {
        // Catch in case of race condition
      });
  }

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // Standard A4 (points)
  const { width, height } = page.getSize();

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Luxury Color Palette (Atelier Noir & Champagne Royal Gold)
  const brandDark = rgb(20 / 255, 20 / 255, 22 / 255); // #141416 Obsidian Noir
  const goldAccent = rgb(197 / 255, 155 / 255, 39 / 255); // #C59B27 Champagne Tuscan Gold
  const textDark = rgb(20 / 255, 20 / 255, 22 / 255);
  const textMuted = rgb(110 / 255, 114 / 255, 125 / 255);
  const bgLight = rgb(248 / 255, 246 / 255, 242 / 255);
  const lineBorder = rgb(225 / 255, 220 / 255, 210 / 255);

  const addr = order.shippingAddressSnapshot as {
    fullName: string;
    mobileNumber: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pinCode: string;
  };

  // 1. Header Banner Box
  page.drawRectangle({
    x: 36,
    y: height - 108,
    width: width - 72,
    height: 72,
    color: brandDark,
  });

  page.drawText(business?.businessName || "FASHION CART", {
    x: 52,
    y: height - 62,
    size: 20,
    font: fontBold,
    color: goldAccent,
  });

  page.drawText("LUXURY ATELIER · OFFICIAL GST TAX INVOICE", {
    x: 52,
    y: height - 80,
    size: 8,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText("Original for Recipient · Retail Sale", {
    x: 52,
    y: height - 94,
    size: 7.5,
    font: fontRegular,
    color: rgb(200 / 255, 200 / 255, 200 / 255),
  });

  // Draw Live Code 128 Barcode on the Header Banner
  const barcodeBars = getBarcodeBars(invoiceNumber);
  const barcodeHeight = 22;
  const barUnitWidth = 0.85;
  let totalBarcodeWidth = 0;
  for (const b of barcodeBars) totalBarcodeWidth += b.width * barUnitWidth;

  const barcodeBoxWidth = totalBarcodeWidth + 16;
  const barcodeBoxX = width - 48 - barcodeBoxWidth;
  const barcodeBoxY = height - 98;

  // White rounded/flat backing box for barcode
  page.drawRectangle({
    x: barcodeBoxX,
    y: barcodeBoxY,
    width: barcodeBoxWidth,
    height: 38,
    color: rgb(1, 1, 1),
  });

  let currentBarX = barcodeBoxX + 8;
  for (const b of barcodeBars) {
    const w = b.width * barUnitWidth;
    if (b.isBlack) {
      page.drawRectangle({
        x: currentBarX,
        y: barcodeBoxY + 11,
        width: w,
        height: barcodeHeight,
        color: brandDark,
      });
    }
    currentBarX += w;
  }

  page.drawText(`*${invoiceNumber}*`, {
    x: barcodeBoxX + (barcodeBoxWidth / 2) - 34,
    y: barcodeBoxY + 3,
    size: 6.5,
    font: fontBold,
    color: textDark,
  });

  // 2. Business & Invoice Details Meta Grid
  let currentY = height - 132;

  // Left Column: Seller Info
  page.drawText("Sold By / Dispatcher:", { x: 36, y: currentY, size: 8.5, font: fontBold, color: textDark });
  page.drawText(business?.businessName || "Fashion Cart", { x: 36, y: currentY - 13, size: 8.5, font: fontBold, color: goldAccent });
  page.drawText((business?.businessAddress || "Atelier Logistics Hub, 108 Fashion Avenue, Indiranagar, Bengaluru - 560038").slice(0, 52), {
    x: 36,
    y: currentY - 24,
    size: 7.5,
    font: fontRegular,
    color: textMuted,
  });
  page.drawText(`GSTIN: ${business?.gstin || "29AABCU9603R1ZM"} · State: Karnataka (29)`, {
    x: 36,
    y: currentY - 35,
    size: 7.5,
    font: fontBold,
    color: textDark,
  });
  page.drawText(`Support: ${business?.email || "support@fashioncart.shop"} · ${business?.phone || "+91 97710 39201"}`, {
    x: 36,
    y: currentY - 46,
    size: 7.5,
    font: fontRegular,
    color: textMuted,
  });

  // Right Column: Invoice Details
  const rightColX = 330;
  page.drawText("Invoice & Dispatch Details:", { x: rightColX, y: currentY, size: 8.5, font: fontBold, color: textDark });
  page.drawText(`Invoice No: ${invoiceNumber}`, { x: rightColX, y: currentY - 13, size: 8, font: fontBold, color: brandDark });
  page.drawText(`Invoice Date: ${new Date(order.createdAt).toLocaleDateString("en-IN")}`, { x: rightColX, y: currentY - 24, size: 7.5, font: fontRegular, color: textDark });
  page.drawText(`Order ID: #${order.orderNumber}`, { x: rightColX, y: currentY - 35, size: 7.5, font: fontBold, color: textDark });
  page.drawText(`Payment: ${order.paymentMethod.replace(/_/g, " ")}${order.payment?.utrNumber ? ` (UTR: ${order.payment.utrNumber})` : ""}`, {
    x: rightColX,
    y: currentY - 46,
    size: 7.5,
    font: fontRegular,
    color: textDark,
  });

  // Divider Line
  currentY -= 60;
  page.drawLine({
    start: { x: 36, y: currentY },
    end: { x: width - 36, y: currentY },
    thickness: 1,
    color: lineBorder,
  });

  // 3. Customer Billing & Shipping Address
  currentY -= 15;
  page.drawText("Billed & Shipped To (Customer):", { x: 36, y: currentY, size: 8.5, font: fontBold, color: textDark });
  currentY -= 13;
  page.drawText(`${addr.fullName} · Phone: ${addr.mobileNumber}`, { x: 36, y: currentY, size: 8, font: fontBold, color: textDark });
  currentY -= 11;
  page.drawText(`${addr.addressLine1}${addr.addressLine2 ? `, ${addr.addressLine2}` : ""}`, { x: 36, y: currentY, size: 7.5, font: fontRegular, color: textMuted });
  currentY -= 11;
  page.drawText(`${addr.city}, ${addr.state} - ${addr.pinCode} · Email: ${order.user.email}`, { x: 36, y: currentY, size: 7.5, font: fontRegular, color: textMuted });

  // 4. Line Items Table Header (Zero Overlap Columns)
  currentY -= 20;
  page.drawRectangle({
    x: 36,
    y: currentY - 16,
    width: width - 72,
    height: 18,
    color: bgLight,
    borderColor: lineBorder,
    borderWidth: 1,
  });

  page.drawText("GARMENT DESCRIPTION", { x: 44, y: currentY - 11, size: 7.5, font: fontBold, color: textDark });
  page.drawText("HSN", { x: 230, y: currentY - 11, size: 7.5, font: fontBold, color: textDark });
  page.drawText("SKU / SIZE", { x: 280, y: currentY - 11, size: 7.5, font: fontBold, color: textDark });
  page.drawText("QTY", { x: 380, y: currentY - 11, size: 7.5, font: fontBold, color: textDark });
  page.drawText("UNIT PRICE", { x: 420, y: currentY - 11, size: 7.5, font: fontBold, color: textDark });
  page.drawText("TOTAL", { x: 495, y: currentY - 11, size: 7.5, font: fontBold, color: textDark });

  currentY -= 24;

  // 5. Items Rows
  for (const item of order.items) {
    page.drawText(item.productNameSnapshot.slice(0, 32), { x: 44, y: currentY, size: 7.5, font: fontBold, color: textDark });
    page.drawText("6204", { x: 230, y: currentY, size: 7, font: fontRegular, color: textMuted });
    page.drawText(`${item.skuSnapshot.slice(0, 14)} / ${item.sizeSnapshot}`, { x: 280, y: currentY, size: 7, font: fontRegular, color: textMuted });
    page.drawText(`${item.quantity}`, { x: 386, y: currentY, size: 7.5, font: fontRegular, color: textDark });
    page.drawText(`INR ${Number(item.unitPrice).toLocaleString("en-IN")}`, { x: 420, y: currentY, size: 7.5, font: fontRegular, color: textDark });
    page.drawText(`INR ${Number(item.total).toLocaleString("en-IN")}`, { x: 495, y: currentY, size: 7.5, font: fontBold, color: textDark });

    currentY -= 16;
  }

  // Divider Line before totals
  currentY -= 6;
  page.drawLine({
    start: { x: 36, y: currentY },
    end: { x: width - 36, y: currentY },
    thickness: 1,
    color: lineBorder,
  });

  // 6. Tax Computation & Totals Box
  currentY -= 16;
  const totalsX = 350;
  const taxableVal = Math.max(0, Number(order.subtotal) - Number(order.discount));
  const gstAmt = Math.round((taxableVal * 0.05) * 100) / 100;
  const halfGst = (gstAmt / 2).toFixed(2);

  page.drawText("Gross Items Subtotal:", { x: totalsX, y: currentY, size: 7.5, font: fontRegular, color: textMuted });
  page.drawText(`INR ${Number(order.subtotal).toLocaleString("en-IN")}`, { x: 495, y: currentY, size: 7.5, font: fontRegular, color: textDark });
  currentY -= 13;

  if (Number(order.discount) > 0) {
    page.drawText(`Special Discount (${order.couponCode || "Promo"}):`, { x: totalsX, y: currentY, size: 7.5, font: fontRegular, color: rgb(220 / 255, 38 / 255, 38 / 255) });
    page.drawText(`- INR ${Number(order.discount).toLocaleString("en-IN")}`, { x: 495, y: currentY, size: 7.5, font: fontBold, color: rgb(220 / 255, 38 / 255, 38 / 255) });
    currentY -= 13;
  }

  page.drawText("Express Doorstep Delivery:", { x: totalsX, y: currentY, size: 7.5, font: fontRegular, color: textMuted });
  page.drawText(Number(order.deliveryCharge) === 0 ? "FREE (Complimentary)" : `INR ${Number(order.deliveryCharge).toLocaleString("en-IN")}`, {
    x: 495,
    y: currentY,
    size: 7.5,
    font: fontRegular,
    color: textDark,
  });
  currentY -= 13;

  page.drawText(`CGST (2.5%) + SGST (2.5%):`, { x: totalsX, y: currentY, size: 7.5, font: fontRegular, color: textMuted });
  page.drawText(`INR ${gstAmt.toFixed(2)}`, { x: 495, y: currentY, size: 7.5, font: fontRegular, color: textDark });
  currentY -= 16;

  // Grand Total Banner
  page.drawRectangle({
    x: totalsX - 10,
    y: currentY - 5,
    width: width - totalsX - 26,
    height: 22,
    color: brandDark,
  });

  page.drawText("GRAND TOTAL:", { x: totalsX, y: currentY + 2, size: 8.5, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText(`INR ${Number(order.total).toLocaleString("en-IN")}`, { x: 485, y: currentY + 2, size: 9.5, font: fontBold, color: goldAccent });

  // 7. Footer Terms & Authenticity Seal
  page.drawText("DECLARATION & TERMS:", { x: 36, y: 74, size: 6.5, font: fontBold, color: textDark });
  page.drawText("1. Goods once sold are eligible for replacement or return within 7 calendar days as per store policy.", { x: 36, y: 64, size: 6, font: fontRegular, color: textMuted });
  page.drawText("2. Computer-generated tax invoice issued in accordance with Section 65B of Indian Information Technology Act.", { x: 36, y: 55, size: 6, font: fontRegular, color: textMuted });
  page.drawText("Fashion Cart Luxury Atelier · Registered Trade Office · support@fashioncart.shop · +91 97710 39201", { x: 36, y: 42, size: 6.5, font: fontBold, color: goldAccent });

  const pdfBytes = await pdfDoc.save();
  const buffer = Buffer.from(pdfBytes);

  return {
    buffer,
    invoiceNumber,
    orderNumber: order.orderNumber,
  };
}
