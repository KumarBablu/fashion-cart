import PDFDocument from "pdfkit";
import QRCode from "qrcode";

export interface ShippingLabelData {
  orderNumber: string;
  storeName: string;
  awbNumber: string;
  carrierName: string;
  routingCode?: string;
  isCod: boolean;
  collectibleAmount: number;
  weightKg: number;
  customer: {
    fullName: string;
    mobileNumber: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pinCode: string;
    landmark?: string;
  };
  sender: {
    businessName: string;
    contactPerson?: string;
    phone: string;
    addressLine1: string;
    city: string;
    state: string;
    pinCode: string;
  };
  items: Array<{
    name: string;
    sku: string;
    size?: string;
    colour?: string;
    quantity: number;
  }>;
}

/**
 * Generates a standard 4x6 inch (288 x 432 pt) thermal shipping label as a PDF Buffer.
 */
export async function generateShippingLabelPdf(data: ShippingLabelData): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      // 4x6 inches at 72dpi = 288 x 432 pt
      const doc = new PDFDocument({
        size: [288, 432],
        margins: { top: 12, bottom: 12, left: 12, right: 12 },
      });

      const buffers: Buffer[] = [];
      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));

      const pageWidth = 288;
      const margin = 12;
      const contentWidth = pageWidth - margin * 2;

      // 1. Header with Carrier & Routing Code
      doc.rect(margin, 12, contentWidth, 38).fillAndStroke("#141416", "#141416");
      doc.fillColor("#FFFFFF").fontSize(11).font("Helvetica-Bold");
      doc.text(data.carrierName.toUpperCase(), margin + 8, 18, { width: contentWidth - 80 });

      doc.fontSize(8).font("Helvetica");
      doc.text(`Store: ${data.storeName}`, margin + 8, 33);

      // Routing Hub Box
      if (data.routingCode) {
        doc.rect(pageWidth - margin - 70, 16, 62, 30).fillAndStroke("#FFFFFF", "#FFFFFF");
        doc.fillColor("#141416").fontSize(10).font("Helvetica-Bold");
        doc.text(data.routingCode, pageWidth - margin - 68, 25, { width: 58, align: "center" });
      }

      // 2. COD / PREPAID Banner
      let currentY = 56;
      if (data.isCod) {
        doc.rect(margin, currentY, contentWidth, 26).fillAndStroke("#DC2626", "#DC2626");
        doc.fillColor("#FFFFFF").fontSize(12).font("Helvetica-Bold");
        doc.text(`C.O.D. COLLECT: ₹${data.collectibleAmount.toLocaleString("en-IN")}`, margin, currentY + 7, {
          width: contentWidth,
          align: "center",
        });
      } else {
        doc.rect(margin, currentY, contentWidth, 24).fillAndStroke("#059669", "#059669");
        doc.fillColor("#FFFFFF").fontSize(11).font("Helvetica-Bold");
        doc.text("PREPAID — DO NOT COLLECT CASH (₹0.00)", margin, currentY + 6, {
          width: contentWidth,
          align: "center",
        });
      }

      // 3. AWB Barcode & QR Area
      currentY += data.isCod ? 32 : 30;
      doc.rect(margin, currentY, contentWidth, 68).stroke("#E5E7EB");

      // Generate QR Code containing tracking & order details
      try {
        const qrDataUrl = await QRCode.toDataURL(
          `AWB:${data.awbNumber}|ORD:${data.orderNumber}|PIN:${data.customer.pinCode}`,
          { margin: 1, width: 60 }
        );
        const qrBase64 = qrDataUrl.split(",")[1];
        const qrBuffer = Buffer.from(qrBase64, "base64");
        doc.image(qrBuffer, pageWidth - margin - 64, currentY + 4, { width: 60, height: 60 });
      } catch (err) {
        console.warn("QR code generation fallback:", err);
      }

      // AWB text details
      doc.fillColor("#6B7280").fontSize(8).font("Helvetica");
      doc.text("AIR WAYBILL (AWB) NUMBER:", margin + 8, currentY + 8);
      doc.fillColor("#111827").fontSize(13).font("Helvetica-Bold");
      doc.text(data.awbNumber, margin + 8, currentY + 20);

      doc.fillColor("#6B7280").fontSize(8).font("Helvetica");
      doc.text(`Order: #${data.orderNumber}  |  Weight: ${data.weightKg} kg`, margin + 8, currentY + 44);

      // 4. Ship To / Destination Address
      currentY += 74;
      doc.rect(margin, currentY, contentWidth, 120).stroke("#111827");
      doc.rect(margin, currentY, contentWidth, 16).fillAndStroke("#F3F4F6", "#111827");

      doc.fillColor("#111827").fontSize(8).font("Helvetica-Bold");
      doc.text("SHIP TO (DELIVERY ADDRESS)", margin + 8, currentY + 4);

      currentY += 22;
      doc.fillColor("#111827").fontSize(11).font("Helvetica-Bold");
      doc.text(data.customer.fullName, margin + 8, currentY);

      doc.fontSize(9).font("Helvetica");
      doc.text(`Phone: ${data.customer.mobileNumber}`, margin + 8, currentY + 14);

      doc.fontSize(8.5).font("Helvetica");
      const addrLine = [
        data.customer.addressLine1,
        data.customer.addressLine2,
        data.customer.landmark ? `Near: ${data.customer.landmark}` : null,
      ]
        .filter(Boolean)
        .join(", ");
      doc.text(addrLine, margin + 8, currentY + 28, { width: contentWidth - 16, height: 32 });

      doc.fillColor("#111827").fontSize(10).font("Helvetica-Bold");
      doc.text(`${data.customer.city}, ${data.customer.state}`, margin + 8, currentY + 62);

      // Big PIN code block
      doc.rect(pageWidth - margin - 90, currentY + 54, 82, 22).fillAndStroke("#111827", "#111827");
      doc.fillColor("#FFFFFF").fontSize(11).font("Helvetica-Bold");
      doc.text(`PIN: ${data.customer.pinCode}`, pageWidth - margin - 88, currentY + 60, { width: 78, align: "center" });

      // 5. Item Summary (Manifest on label)
      currentY += 84;
      doc.rect(margin, currentY, contentWidth, 54).stroke("#E5E7EB");
      doc.fillColor("#6B7280").fontSize(7.5).font("Helvetica-Bold");
      doc.text("ITEM SUMMARY (SKU / SIZE / QTY)", margin + 8, currentY + 6);

      let itemY = currentY + 18;
      data.items.slice(0, 2).forEach((item) => {
        doc.fillColor("#111827").fontSize(7.5).font("Helvetica");
        const spec = [item.size, item.colour].filter(Boolean).join("/");
        doc.text(`• ${item.name.slice(0, 30)} (${item.sku}${spec ? ` - ${spec}` : ""}) x${item.quantity}`, margin + 8, itemY, {
          width: contentWidth - 16,
        });
        itemY += 12;
      });

      // 6. Return / Pickup Address (Sender)
      currentY += 60;
      doc.rect(margin, currentY, contentWidth, 42).fillAndStroke("#F9FAFB", "#E5E7EB");
      doc.fillColor("#6B7280").fontSize(7).font("Helvetica-Bold");
      doc.text("RETURN IF UNDELIVERED TO:", margin + 8, currentY + 4);

      doc.fillColor("#374151").fontSize(7).font("Helvetica");
      doc.text(
        `${data.sender.businessName}, ${data.sender.addressLine1}, ${data.sender.city}, ${data.sender.state} - ${data.sender.pinCode} | Ph: ${data.sender.phone}`,
        margin + 8,
        currentY + 15,
        { width: contentWidth - 16 }
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
