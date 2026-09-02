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
 * Standard Code 128 (Subset B) Barcode Patterns Table
 * Encodes alphanumeric strings into 11-module bar/space patterns for 1D laser scanners.
 */
const CODE128_PATTERNS: Record<number, string> = {
  0: "212222", 1: "222122", 2: "222221", 3: "121223", 4: "121322", 5: "131222", 6: "122213",
  7: "122312", 8: "132212", 9: "221213", 10: "221312", 11: "231212", 12: "112232", 13: "122132",
  14: "122231", 15: "113222", 16: "123122", 17: "123221", 18: "223211", 19: "221132", 20: "221231",
  21: "213212", 22: "223112", 23: "312131", 24: "311222", 25: "321122", 26: "321221", 27: "312212",
  28: "322112", 29: "322211", 30: "212123", 31: "212321", 32: "232121", 33: "111323", 34: "131123",
  35: "131321", 36: "112313", 37: "132113", 38: "132311", 39: "211313", 40: "231113", 41: "231311",
  42: "112133", 43: "112331", 44: "132131", 45: "113123", 46: "113321", 47: "133121", 48: "313121",
  49: "211331", 50: "231131", 51: "213113", 52: "213311", 53: "213131", 54: "311123", 55: "311321",
  56: "331121", 57: "312113", 58: "312311", 59: "332111", 60: "314111", 61: "221411", 62: "431111",
  63: "111224", 64: "111422", 65: "121124", 66: "121421", 67: "141122", 68: "141221", 69: "112214",
  70: "112412", 71: "122114", 72: "122411", 73: "142112", 74: "142211", 75: "241211", 76: "221114",
  77: "413111", 78: "241112", 79: "134111", 80: "111242", 81: "121142", 82: "121241", 83: "114212",
  84: "124112", 85: "124211", 86: "411212", 87: "421112", 88: "421211", 89: "212141", 90: "214121",
  91: "412121", 92: "111143", 93: "111341", 94: "131141", 95: "114113", 96: "114311", 97: "411113",
  98: "411311", 99: "113141", 100: "114131", 101: "311141", 102: "411131", 103: "211412", 104: "211214",
  105: "211232", 106: "2331112"
};

function encodeCode128B(text: string): string {
  const codes: number[] = [104]; // START_B
  let checksum = 104;

  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i) - 32;
    if (code >= 0 && code <= 95) {
      codes.push(code);
      checksum += code * (i + 1);
    }
  }

  codes.push(checksum % 103);
  codes.push(106); // STOP

  let bitPattern = "";
  for (const c of codes) {
    const pattern = CODE128_PATTERNS[c] || "212222";
    let isBar = true;
    for (let j = 0; j < pattern.length; j++) {
      const width = parseInt(pattern[j], 10);
      bitPattern += (isBar ? "1" : "0").repeat(width);
      isBar = !isBar;
    }
  }
  return bitPattern;
}

/**
 * Draws a clean, high-resolution vector 1D linear barcode in PDFKit.
 */
function drawBarcode(doc: PDFKit.PDFDocument, text: string, x: number, y: number, width: number, height: number) {
  const bits = encodeCode128B(text.toUpperCase());
  const moduleWidth = width / bits.length;

  doc.save();
  let inBar = false;
  let barStart = 0;

  for (let i = 0; i < bits.length; i++) {
    if (bits[i] === "1" && !inBar) {
      inBar = true;
      barStart = i;
    } else if (bits[i] === "0" && inBar) {
      inBar = false;
      const barWidth = (i - barStart) * moduleWidth;
      doc.rect(x + barStart * moduleWidth, y, barWidth, height).fill("#000000");
    }
  }
  if (inBar) {
    const barWidth = (bits.length - barStart) * moduleWidth;
    doc.rect(x + barStart * moduleWidth, y, barWidth, height).fill("#000000");
  }
  doc.restore();
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
        margins: { top: 10, bottom: 10, left: 10, right: 10 },
      });

      const buffers: Buffer[] = [];
      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));

      const pageWidth = 288;
      const margin = 10;
      const contentWidth = pageWidth - margin * 2;

      // 1. Top Header: Carrier Badge & Routing Hub Box
      doc.rect(margin, 10, contentWidth, 38).fillAndStroke("#0F172A", "#0F172A");
      doc.fillColor("#FFFFFF").fontSize(11).font("Helvetica-Bold");
      doc.text(data.carrierName.toUpperCase(), margin + 8, 16, { width: contentWidth - 85 });

      doc.fontSize(7.5).font("Helvetica");
      doc.text(`Store: ${data.storeName}`, margin + 8, 31, { width: contentWidth - 85 });

      // Routing Hub Box (Top Right)
      const routingText = data.routingCode || `${data.customer.state.slice(0, 3).toUpperCase()}-HUB`;
      doc.rect(pageWidth - margin - 72, 14, 64, 30).fillAndStroke("#FFFFFF", "#FFFFFF");
      doc.rect(pageWidth - margin - 72, 14, 64, 30).lineWidth(1).stroke("#0F172A");
      doc.fillColor("#0F172A").fontSize(10).font("Helvetica-Bold");
      doc.text(routingText, pageWidth - margin - 70, 23, { width: 60, align: "center" });

      // 2. COD / PREPAID Banner (With clear currency notation without Unicode glitching)
      let currentY = 52;
      const formattedAmount = data.collectibleAmount.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

      if (data.isCod) {
        doc.rect(margin, currentY, contentWidth, 26).fillAndStroke("#DC2626", "#DC2626");
        doc.fillColor("#FFFFFF").fontSize(11.5).font("Helvetica-Bold");
        doc.text(`C.O.D. COLLECT: Rs. ${formattedAmount}`, margin, currentY + 7, {
          width: contentWidth,
          align: "center",
        });
      } else {
        doc.rect(margin, currentY, contentWidth, 24).fillAndStroke("#059669", "#059669");
        doc.fillColor("#FFFFFF").fontSize(10.5).font("Helvetica-Bold");
        doc.text("PREPAID — DO NOT COLLECT CASH (Rs. 0.00)", margin, currentY + 6, {
          width: contentWidth,
          align: "center",
        });
      }

      // 3. AWB Barcode & QR Area
      currentY += data.isCod ? 30 : 28;
      doc.rect(margin, currentY, contentWidth, 76).lineWidth(1).stroke("#CBD5E1");

      // Draw 1D Linear Barcode for high-speed laser scanners
      const barcodeWidth = contentWidth - 78;
      drawBarcode(doc, data.awbNumber, margin + 8, currentY + 8, barcodeWidth, 28);

      // AWB Human Readable Text
      doc.fillColor("#0F172A").fontSize(11).font("Helvetica-Bold");
      doc.text(data.awbNumber, margin + 8, currentY + 39, { width: barcodeWidth, align: "center" });

      // Order & Weight Metadata
      doc.fillColor("#64748B").fontSize(7.5).font("Helvetica");
      doc.text(`Order: #${data.orderNumber}  |  Weight: ${data.weightKg} kg`, margin + 8, currentY + 56);

      // 2D QR Code (Right Side)
      try {
        const qrDataUrl = await QRCode.toDataURL(
          `AWB:${data.awbNumber}|ORD:${data.orderNumber}|PIN:${data.customer.pinCode}`,
          { margin: 1, width: 62 }
        );
        const qrBase64 = qrDataUrl.split(",")[1];
        const qrBuffer = Buffer.from(qrBase64, "base64");
        doc.image(qrBuffer, pageWidth - margin - 66, currentY + 7, { width: 60, height: 60 });
      } catch (err) {
        console.warn("QR code generation fallback:", err);
      }

      // 4. Ship To (Consignee Delivery Address)
      currentY += 82;
      doc.rect(margin, currentY, contentWidth, 114).lineWidth(1.5).stroke("#0F172A");
      doc.rect(margin, currentY, contentWidth, 16).fillAndStroke("#F1F5F9", "#0F172A");

      doc.fillColor("#0F172A").fontSize(8).font("Helvetica-Bold");
      doc.text("SHIP TO (DELIVERY ADDRESS)", margin + 8, currentY + 4);

      currentY += 20;
      doc.fillColor("#0F172A").fontSize(11).font("Helvetica-Bold");
      doc.text(data.customer.fullName, margin + 8, currentY);

      doc.fontSize(9).font("Helvetica-Bold");
      doc.text(`Ph: ${data.customer.mobileNumber}`, margin + 8, currentY + 13);

      doc.fontSize(8.5).font("Helvetica");
      const addrLine = [
        data.customer.addressLine1,
        data.customer.addressLine2,
        data.customer.landmark ? `Landmark: ${data.customer.landmark}` : null,
      ]
        .filter(Boolean)
        .join(", ");
      doc.text(addrLine, margin + 8, currentY + 26, { width: contentWidth - 16, height: 32 });

      doc.fillColor("#0F172A").fontSize(10).font("Helvetica-Bold");
      doc.text(`${data.customer.city}, ${data.customer.state}`, margin + 8, currentY + 60);

      // Big Solid Destination PIN Box
      doc.rect(pageWidth - margin - 96, currentY + 52, 88, 22).fillAndStroke("#0F172A", "#0F172A");
      doc.fillColor("#FFFFFF").fontSize(11).font("Helvetica-Bold");
      doc.text(`PIN: ${data.customer.pinCode}`, pageWidth - margin - 94, currentY + 58, {
        width: 84,
        align: "center",
      });

      // 5. Item Manifest Table
      currentY += 80;
      doc.rect(margin, currentY, contentWidth, 48).lineWidth(1).stroke("#E2E8F0");
      doc.fillColor("#64748B").fontSize(7.5).font("Helvetica-Bold");
      doc.text("ITEM SUMMARY (SKU / SIZE / QTY)", margin + 8, currentY + 5);

      let itemY = currentY + 16;
      data.items.slice(0, 2).forEach((item) => {
        doc.fillColor("#0F172A").fontSize(7.5).font("Helvetica");
        const spec = [item.size, item.colour].filter(Boolean).join("/");
        doc.text(
          `• ${item.name.slice(0, 32)} (${item.sku}${spec ? ` - ${spec}` : ""}) x${item.quantity}`,
          margin + 8,
          itemY,
          { width: contentWidth - 16 }
        );
        itemY += 12;
      });

      // 6. Return / Dispatch Hub Address (Sender)
      currentY += 52;
      doc.rect(margin, currentY, contentWidth, 38).fillAndStroke("#F8FAFC", "#E2E8F0");
      doc.fillColor("#64748B").fontSize(7).font("Helvetica-Bold");
      doc.text("RETURN IF UNDELIVERED TO:", margin + 8, currentY + 4);

      doc.fillColor("#334155").fontSize(7).font("Helvetica");
      doc.text(
        `${data.sender.businessName}, ${data.sender.addressLine1}, ${data.sender.city}, ${data.sender.state} - ${data.sender.pinCode} | Ph: ${data.sender.phone}`,
        margin + 8,
        currentY + 14,
        { width: contentWidth - 16 }
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
