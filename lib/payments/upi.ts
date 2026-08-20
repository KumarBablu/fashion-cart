import QRCode from "qrcode";

export type UpiPaymentParams = {
  upiId: string;
  payeeName?: string;
  amount: number;
  orderNumber: string;
  transactionNote?: string;
};

/**
 * Builds an official NPCI standard UPI Payment URI.
 * When scanned by any UPI app (GPay, PhonePe, Paytm, BHIM, CRED, etc.),
 * the app automatically pre-populates and locks the exact order amount.
 */
export function buildUpiPaymentUri(params: UpiPaymentParams): string {
  const cleanUpi = params.upiId.trim();
  const cleanAmount = Number(params.amount).toFixed(2);
  const cleanPayee = (params.payeeName || "Fashion Cart").replace(/[^a-zA-Z0-9 ]/g, "").trim() || "Fashion Cart";
  const note = params.transactionNote || `Order #${params.orderNumber}`;

  const searchParams = new URLSearchParams({
    pa: cleanUpi,
    pn: cleanPayee,
    am: cleanAmount,
    cu: "INR",
    tn: note,
    tr: params.orderNumber,
  });

  return `upi://pay?${searchParams.toString()}`;
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
