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
 * Builds the official NPCI string payload for QR code scanners.
 * Clean, standard format recognized by 100% of Indian banking and UPI apps (BHIM, PhonePe, Paytm, GPay, Navi).
 */
export function buildUpiQrString(params: UpiPaymentParams): string {
  const cleanUpi = params.upiId.trim();
  const cleanAmount = Number(params.amount).toFixed(2);
  const payee = (cleanUpi.includes("9771039201") ? "Bablu Kumar" : (params.payeeName || "Bablu Kumar"))
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .trim();
  const cleanNote = (params.transactionNote || `Order-${params.orderNumber}`)
    .replace(/[^a-zA-Z0-9-]/g, "")
    .trim();

  return `upi://pay?pa=${cleanUpi}&pn=${encodeURIComponent(payee)}&am=${cleanAmount}&cu=INR&tn=${encodeURIComponent(cleanNote)}`;
}

/**
 * Builds an official, 100% compliant NPCI UPI Payment Deep Link URI for mobile browser intent handlers.
 */
export function buildUpiPaymentUri(params: UpiPaymentParams): string {
  const cleanUpi = params.upiId.trim();
  const cleanAmount = Number(params.amount).toFixed(2);
  const payee = (cleanUpi.includes("9771039201") ? "Bablu Kumar" : (params.payeeName || "Bablu Kumar"))
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .trim();
  const cleanNote = (params.transactionNote || `Order-${params.orderNumber}`)
    .replace(/[^a-zA-Z0-9-]/g, "")
    .trim();

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
 * Uses 'H' (High 30%) error correction and clear margin for 100% scan reliability.
 */
export async function generateDynamicUpiQrDataUrl(
  params: UpiPaymentParams,
  options?: { size?: number; primaryColor?: string }
): Promise<string> {
  const qrString = buildUpiQrString(params);
  return QRCode.toDataURL(qrString, {
    width: options?.size || 400,
    margin: 2,
    color: {
      dark: options?.primaryColor || "#000000",
      light: "#FFFFFF",
    },
    errorCorrectionLevel: "H",
  });
}
