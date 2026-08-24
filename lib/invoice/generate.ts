import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { getDb } from "@/lib/db";
import { generateInvoiceNumber } from "@/lib/order-number";
import { generateQrPngBuffer } from "./qr";

/**
 * Generates an in-memory GST-compliant PDF invoice buffer for an order using pdf-lib with embedded QR Code verification.
 * 100% web-standards, zero-filesystem dependencies, perfectly compatible with Vercel serverless.
 */
export async function generateInvoiceBufferForOrder(orderId: string): Promise<{
  buffer: Buffer;
  invoiceNumber: string;
  orderNumber: string;
}> {
  let store: "garments" | "jewellery" = "garments";
  let db = getDb("garments");

  let order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: true, user: true, payment: true },
  });

  if (!order) {
    const jwDb = getDb("jewellery");
    order = await jwDb.order.findUnique({
      where: { id: orderId },
      include: { items: true, user: true, payment: true },
    });
    if (order) {
      store = "jewellery";
      db = jwDb;
    }
  }

  if (!order) {
    throw new Error(`Order ${orderId} not found`);
  }

  const existing = await db.invoice.findUnique({ where: { orderId } });
  const invoiceNumber = existing?.invoiceNumber ?? (await generateInvoiceNumber(store));
  const business = await db.businessSettings.findFirst();

  // Create invoice record in database if not yet present
  if (!existing) {
    await db.invoice
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

  // Sanitize GSTIN (protect against internal store control strings)
  const cleanGstin =
    business?.gstin && !business.gstin.startsWith("STORE_CTRL:") && business.gstin.length <= 25
      ? business.gstin
      : "10AABCU9603R1ZM";

  // Generate and embed high-resolution QR code
  const appBase = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://fashioncartstore.vercel.app";
  const verificationUrl = `${appBase}/invoices/${order.id}`;
  const qrPngBuffer = await generateQrPngBuffer(verificationUrl, 240);
  const qrImage = await pdfDoc.embedPng(qrPngBuffer);

  // 1. Header Banner Box
  const headerBoxY = height - 120;
  const headerBoxHeight = 84;

  page.drawRectangle({
    x: 36,
    y: headerBoxY,
    width: width - 72,
    height: headerBoxHeight,
    color: brandDark,
  });

  // Company Branding on Banner
  page.drawText(business?.businessName || "Fashion Cart", {
    x: 52,
    y: headerBoxY + 54,
    size: 22,
    font: fontBold,
    color: goldAccent,
  });

  page.drawText("PREMIUM OUTLET - OFFICIAL GST TAX INVOICE", {
    x: 52,
    y: headerBoxY + 38,
    size: 8,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText("Original for Recipient - Retail Sale Tax Invoice", {
    x: 52,
    y: headerBoxY + 24,
    size: 7.5,
    font: fontRegular,
    color: rgb(210 / 255, 210 / 255, 210 / 255),
  });

  page.drawText("Scan QR code on the right for instant digital verification & tax audit copy", {
    x: 52,
    y: headerBoxY + 11,
    size: 6.5,
    font: fontRegular,
    color: goldAccent,
  });

  // Draw QR Code in White Framing Box
  const qrSize = 64;
  const qrBoxX = width - 48 - qrSize - 12;
  const qrBoxY = headerBoxY + 10;

  page.drawRectangle({
    x: qrBoxX,
    y: qrBoxY,
    width: qrSize + 12,
    height: qrSize + 12,
    color: rgb(1, 1, 1),
  });

  page.drawImage(qrImage, {
    x: qrBoxX + 6,
    y: qrBoxY + 6,
    width: qrSize,
    height: qrSize,
  });

  // 2. Business & Invoice Details Meta Grid
  let currentY = headerBoxY - 22;

  // Left Column: Seller Info
  page.drawText("Sold By / Registered Dispatcher:", { x: 36, y: currentY, size: 8.5, font: fontBold, color: textDark });
  page.drawText(business?.businessName || "Fashion Cart", { x: 36, y: currentY - 14, size: 9, font: fontBold, color: goldAccent });
  page.drawText("Sonar Toli, City: Siwan", { x: 36, y: currentY - 26, size: 7.5, font: fontRegular, color: textMuted });
  page.drawText("State: Bihar, PIN: 841226", { x: 36, y: currentY - 37, size: 7.5, font: fontRegular, color: textMuted });
  page.drawText(`GSTIN: ${cleanGstin} · State: Bihar (10)`, {
    x: 36,
    y: currentY - 49,
    size: 7.5,
    font: fontBold,
    color: textDark,
  });
  page.drawText(`Contact: ${business?.email || "Fashioncart.support@gmail.com"} - ${business?.phone || "+91 97710 39201"}`, {
    x: 36,
    y: currentY - 60,
    size: 7.5,
    font: fontRegular,
    color: textMuted,
  });

  // Right Column: Invoice Details
  const rightColX = 320;
  page.drawText("Invoice & Dispatch Details:", { x: rightColX, y: currentY, size: 8.5, font: fontBold, color: textDark });
  page.drawText(`Invoice No: ${invoiceNumber}`, { x: rightColX, y: currentY - 14, size: 8.5, font: fontBold, color: brandDark });
  page.drawText(`Invoice Date: ${new Date(order.createdAt).toLocaleDateString("en-IN")}`, { x: rightColX, y: currentY - 26, size: 7.5, font: fontRegular, color: textDark });
  const paymentChannelText = order.payment?.instrumentDetails
    ? `${order.payment.gatewayName || "Razorpay"} ${order.payment.paymentChannel || ""} (${order.payment.instrumentDetails})`
    : order.paymentMethod.replace(/_/g, " ");

  page.drawText(`Payment: ${paymentChannelText}`, {
    x: rightColX,
    y: currentY - 49,
    size: 7,
    font: fontRegular,
    color: textDark,
  });
  page.drawText(`Payment Status: ${order.payment?.status === "VERIFIED" ? "PAID & 100% VERIFIED" : "CONFIRMED"}`, {
    x: rightColX,
    y: currentY - 60,
    size: 7.5,
    font: fontBold,
    color: rgb(22 / 255, 101 / 255, 52 / 255),
  });

  // Divider Line
  currentY -= 74;
  page.drawLine({
    start: { x: 36, y: currentY },
    end: { x: width - 36, y: currentY },
    thickness: 1,
    color: lineBorder,
  });

  // 3. Customer Billing & Shipping Address
  currentY -= 16;
  page.drawText("Billed & Shipped To (Customer Details):", { x: 36, y: currentY, size: 8.5, font: fontBold, color: textDark });
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
  page.drawText("HSN", { x: 225, y: currentY - 11, size: 7.5, font: fontBold, color: textDark });
  page.drawText("SKU / VARIANT", { x: 275, y: currentY - 11, size: 7.5, font: fontBold, color: textDark });
  page.drawText("QTY", { x: 375, y: currentY - 11, size: 7.5, font: fontBold, color: textDark });
  page.drawText("UNIT PRICE", { x: 415, y: currentY - 11, size: 7.5, font: fontBold, color: textDark });
  page.drawText("TOTAL (INR)", { x: 488, y: currentY - 11, size: 7.5, font: fontBold, color: textDark });

  currentY -= 24;

  // 5. Items Rows
  for (const item of order.items) {
    page.drawText(item.productNameSnapshot.slice(0, 32), { x: 44, y: currentY, size: 7.5, font: fontBold, color: textDark });
    page.drawText("6204.19", { x: 225, y: currentY, size: 7, font: fontRegular, color: textMuted });
    page.drawText(`${item.skuSnapshot.slice(0, 14)} (${item.sizeSnapshot})`, { x: 275, y: currentY, size: 7, font: fontRegular, color: textMuted });
    page.drawText(`${item.quantity}`, { x: 382, y: currentY, size: 7.5, font: fontRegular, color: textDark });
    page.drawText(`INR ${Number(item.unitPrice).toLocaleString("en-IN")}`, { x: 415, y: currentY, size: 7.5, font: fontRegular, color: textDark });
    page.drawText(`INR ${Number(item.total).toLocaleString("en-IN")}`, { x: 488, y: currentY, size: 7.5, font: fontBold, color: textDark });

    currentY -= 18;
  }

  // Divider Line before totals
  currentY -= 8;
  page.drawLine({
    start: { x: 36, y: currentY },
    end: { x: width - 36, y: currentY },
    thickness: 1,
    color: lineBorder,
  });

  // 6. Tax Computation & Totals Box (GUARANTEED ZERO OVERLAP WITH FIXED SPACING)
  currentY -= 18;
  const totalsLabelX = 310;
  const totalsValueX = 488;
  const taxableVal = Math.max(0, Number(order.subtotal) - Number(order.discount));
  const totalGstAmt = Math.round((taxableVal * 0.05) * 100) / 100;
  const halfGstAmt = (totalGstAmt / 2).toFixed(2);

  page.drawText("Gross Items Subtotal:", { x: totalsLabelX, y: currentY, size: 7.5, font: fontRegular, color: textMuted });
  page.drawText(`INR ${Number(order.subtotal).toLocaleString("en-IN")}`, { x: totalsValueX, y: currentY, size: 7.5, font: fontRegular, color: textDark });
  currentY -= 14;

  if (Number(order.discount) > 0) {
    page.drawText(`Special Discount (${order.couponCode || "Promo"}):`, { x: totalsLabelX, y: currentY, size: 7.5, font: fontRegular, color: rgb(220 / 255, 38 / 255, 38 / 255) });
    page.drawText(`- INR ${Number(order.discount).toLocaleString("en-IN")}`, { x: totalsValueX, y: currentY, size: 7.5, font: fontBold, color: rgb(220 / 255, 38 / 255, 38 / 255) });
    currentY -= 14;
  }

  page.drawText("Express Doorstep Delivery:", { x: totalsLabelX, y: currentY, size: 7.5, font: fontRegular, color: textMuted });
  page.drawText(Number(order.deliveryCharge) === 0 ? "FREE (Complimentary)" : `INR ${Number(order.deliveryCharge).toLocaleString("en-IN")}`, {
    x: totalsValueX,
    y: currentY,
    size: 7.5,
    font: fontRegular,
    color: textDark,
  });
  currentY -= 14;

  page.drawText(`Central GST (CGST @ 2.5%):`, { x: totalsLabelX, y: currentY, size: 7.5, font: fontRegular, color: textMuted });
  page.drawText(`INR ${halfGstAmt}`, { x: totalsValueX, y: currentY, size: 7.5, font: fontRegular, color: textDark });
  currentY -= 14;

  page.drawText(`State GST (SGST @ 2.5%):`, { x: totalsLabelX, y: currentY, size: 7.5, font: fontRegular, color: textMuted });
  page.drawText(`INR ${halfGstAmt}`, { x: totalsValueX, y: currentY, size: 7.5, font: fontRegular, color: textDark });
  currentY -= 18;

  // Grand Total Banner Box (24pt below last tax line to guarantee ZERO collision)
  const bannerY = currentY - 14;
  const bannerHeight = 26;

  page.drawRectangle({
    x: totalsLabelX - 12,
    y: bannerY,
    width: width - totalsLabelX - 24,
    height: bannerHeight,
    color: brandDark,
  });

  page.drawText("GRAND TOTAL (INCL. TAXES):", {
    x: totalsLabelX,
    y: bannerY + 8,
    size: 8.5,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText(`INR ${Number(order.total).toLocaleString("en-IN")}`, {
    x: totalsValueX - 10,
    y: bannerY + 7,
    size: 11,
    font: fontBold,
    color: goldAccent,
  });

  // 7. Footer Terms & Authenticity Seal
  page.drawText("DECLARATION & TERMS OF SALE:", { x: 36, y: 78, size: 6.5, font: fontBold, color: textDark });
  page.drawText("1. Goods once sold are eligible for replacement or return within 7 calendar days as per store policy.", { x: 36, y: 68, size: 6, font: fontRegular, color: textMuted });
  page.drawText("2. Computer-generated tax invoice issued in accordance with Section 65B of Indian Information Technology Act, 2000.", { x: 36, y: 58, size: 6, font: fontRegular, color: textMuted });
  page.drawText("Fashion Cart Luxury Atelier - Registered Trade Office - fashioncart.support@gmail.com - +91 97710 39201", { x: 36, y: 44, size: 6.5, font: fontBold, color: goldAccent });

  const pdfBytes = await pdfDoc.save();
  const buffer = Buffer.from(pdfBytes);

  return {
    buffer,
    invoiceNumber,
    orderNumber: order.orderNumber,
  };
}
