import QRCode from "qrcode";

export type UpiPaymentParams = {
  upiId: string;
  payeeName?: string;
  amount: number;
  orderNumber: string;
  transactionNote?: string;
  callbackUrl?: string;
};

/**
 * Builds an official NPCI standard UPI Payment URI.
 * Uses %20 for spaces and preserves raw @ in UPI ID for clean rendering in Google Pay / PhonePe.
 */
export function buildUpiPaymentUri(params: UpiPaymentParams): string {
  const cleanUpi = params.upiId.trim();
  const cleanAmount = Number(params.amount).toFixed(2);
  const payee = (params.payeeName || "Fashion Cart").trim();
  const note = params.transactionNote || `Order #${params.orderNumber}`;

  const queryParts = [
    `pa=${encodeURIComponent(cleanUpi).replace(/%40/g, "@")}`,
    `pn=${encodeURIComponent(payee).replace(/%20/g, "%20")}`,
    `am=${cleanAmount}`,
    `cu=INR`,
    `tn=${encodeURIComponent(note)}`,
    `tr=${encodeURIComponent(params.orderNumber)}`,
  ];

  if (params.callbackUrl) {
    queryParts.push(`url=${encodeURIComponent(params.callbackUrl)}`);
  }

  return `upi://pay?${queryParts.join("&")}`;
}

/**
 * Generates a high-definition base64 Data URL for a dynamic UPI QR Code.
 */
export async function generateDynamicUpiQrDataUrl(
  params: UpiPaymentParams,
  options?: { size?: number; primaryColor?: string }
): Promise<string> {
  const upiUri = buildUpiPaymentUri(params);
  return QRCode.toDataURL(upiUri, {
    width: options?.size || 340,
    margin: 1,
    color: {
      dark: options?.primaryColor || "#141416",
      light: "#FFFFFF",
    },
    errorCorrectionLevel: "H",
  });
}
