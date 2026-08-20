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
 * Builds the official string payload for scanning by camera QR code scanners (BHIM, GPay, PhonePe, Paytm).
 * Uses universal '+' for spaces conforming to NPCI Common QR Specification.
 */
export function buildUpiQrString(params: UpiPaymentParams): string {
  const cleanUpi = params.upiId.trim();
  const cleanAmount = Number(params.amount).toFixed(2);
  const payee = (cleanUpi.includes("9771039201") ? "Bablu Kumar" : (params.payeeName || "Bablu Kumar"))
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .trim()
    .replace(/\s+/g, "+");
  const cleanNote = (params.transactionNote || `Order ${params.orderNumber}`)
    .replace(/[^a-zA-Z0-9 -]/g, "")
    .trim()
    .replace(/\s+/g, "+");

  return `upi://pay?pa=${cleanUpi}&pn=${payee}&am=${cleanAmount}&cu=INR&tn=${cleanNote}`;
}

/**
 * Builds an official, 100% compliant NPCI UPI Payment Deep Link URI for mobile browser intent handlers.
 * Uses universal '+' encoding so BHIM, GPay, PhonePe, and Paytm decode clean 'Bablu Kumar' without '%20' or beneficiary errors.
 */
export function buildUpiPaymentUri(params: UpiPaymentParams): string {
  const cleanUpi = params.upiId.trim();
  const cleanAmount = Number(params.amount).toFixed(2);
  const payee = (cleanUpi.includes("9771039201") ? "Bablu Kumar" : (params.payeeName || "Bablu Kumar"))
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .trim()
    .replace(/\s+/g, "+");
  const cleanNote = (params.transactionNote || `Order ${params.orderNumber}`)
    .replace(/[^a-zA-Z0-9 -]/g, "")
    .trim()
    .replace(/\s+/g, "+");

  const query = `pa=${cleanUpi}&pn=${payee}&am=${cleanAmount}&cu=INR&tn=${cleanNote}`;

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
