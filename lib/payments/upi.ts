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
 * Builds an official, 100% compliant NPCI UPI Payment URI.
 * - Strips risky parameters (like unsigned 'url' or hash '#' in note) that trigger
 *   'UPI not verified' or 'Unverified merchant' security flags in Google Pay, PhonePe, and Paytm.
 * - Uses clean percent-encoding for spaces and retains raw '@' in VPA.
 */
export function buildUpiPaymentUri(params: UpiPaymentParams): string {
  const cleanUpi = params.upiId.trim();
  const cleanAmount = Number(params.amount).toFixed(2);
  // Clean payee name to avoid bank name mismatch flags
  const payee = (params.payeeName || "Fashion Cart").replace(/[^a-zA-Z0-9 ]/g, " ").trim();
  // Clean note to avoid hash '#' symbol breaking URI parsing in Android intent handlers
  const cleanNote = (params.transactionNote || `Order ${params.orderNumber}`).replace(/[#%&?]/g, "").trim();

  // Strict universal NPCI P2P/P2M compliant parameters
  const query = `pa=${cleanUpi}&pn=${encodeURIComponent(payee)}&am=${cleanAmount}&cu=INR&tn=${encodeURIComponent(cleanNote)}`;

  switch (params.appScheme) {
    case "phonepe":
      return `phonepe://pay?${query}`;
    case "paytm":
      return `paytmmp://pay?${query}`;
    case "gpay":
      return `gpay://upi/pay?${query}`;
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
  // Dynamic QR code always uses universal upi:// scheme
  const upiUri = buildUpiPaymentUri({ ...params, appScheme: "generic" });
  return QRCode.toDataURL(upiUri, {
    width: options?.size || 340,
    margin: 1,
    color: {
      dark: options?.primaryColor || "#141416",
      light: "#FFFFFF",
    },
    errorCorrectionLevel: "M",
  });
}
