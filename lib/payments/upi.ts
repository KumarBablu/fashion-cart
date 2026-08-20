import QRCode from "qrcode";

export type UpiPaymentParams = {
  upiId: string;
  payeeName?: string;
  amount: number;
  orderNumber: string;
  transactionNote?: string;
  appScheme?: "generic" | "gpay" | "phonepe" | "paytm" | "bhim";
};

/**
 * Builds the official string payload for scanning by QR code scanners (BHIM, GPay, PhonePe, Paytm).
 * Uses clean unescaped UTF-8 string format required by NPCI QR scanners so regex doesn't fail on '%' characters.
 */
export function buildUpiQrString(params: UpiPaymentParams): string {
  const cleanUpi = params.upiId.trim();
  const cleanAmount = Number(params.amount).toFixed(2);
  const payee = cleanUpi.includes("9771039201")
    ? "Bablu Kumar"
    : (params.payeeName || "Bablu Kumar").replace(/[^a-zA-Z0-9 ]/g, " ").trim();
  const cleanNote = (params.transactionNote || `Order ${params.orderNumber}`).replace(/[^a-zA-Z0-9 -]/g, "").trim();

  return `upi://pay?pa=${cleanUpi}&pn=${payee}&am=${cleanAmount}&cu=INR&tn=${cleanNote}`;
}

/**
 * Builds an official, 100% compliant NPCI UPI Payment Deep Link URI for mobile browser intent handlers.
 */
export function buildUpiPaymentUri(params: UpiPaymentParams): string {
  const cleanUpi = params.upiId.trim();
  const cleanAmount = Number(params.amount).toFixed(2);
  const payee = cleanUpi.includes("9771039201")
    ? "Bablu Kumar"
    : (params.payeeName || "Bablu Kumar").replace(/[^a-zA-Z0-9 ]/g, " ").trim();
  const cleanNote = (params.transactionNote || `Order ${params.orderNumber}`).replace(/[^a-zA-Z0-9 ]/g, " ").trim();

  const query = `pa=${cleanUpi}&pn=${encodeURIComponent(payee)}&am=${cleanAmount}&cu=INR&tn=${encodeURIComponent(cleanNote)}`;

  switch (params.appScheme) {
    case "phonepe":
      return `phonepe://pay?${query}`;
    case "paytm":
      return `paytmmp://pay?${query}`;
    case "gpay":
    case "bhim":
    case "generic":
    default:
      return `upi://pay?${query}`;
  }
}

/**
 * Generates a high-definition base64 Data URL for a dynamic UPI QR Code.
 */
export async function generateDynamicUpiQrDataUrl(
  params: UpiPaymentParams,
  options?: { size?: number; primaryColor?: string }
): Promise<string> {
  const qrString = buildUpiQrString(params);
  return QRCode.toDataURL(qrString, {
    width: options?.size || 340,
    margin: 1,
    color: {
      dark: options?.primaryColor || "#141416",
      light: "#FFFFFF",
    },
    errorCorrectionLevel: "M",
  });
}
