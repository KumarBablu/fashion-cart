import QRCode from "qrcode";

/**
 * Generates a PNG Buffer of a QR Code for PDF embedding.
 */
export async function generateQrPngBuffer(text: string, size: number = 200): Promise<Buffer> {
  return QRCode.toBuffer(text, {
    type: "png",
    width: size,
    margin: 1,
    color: {
      dark: "#141416",
      light: "#FFFFFF",
    },
    errorCorrectionLevel: "M",
  });
}

/**
 * Generates an SVG string of a QR Code for web / print rendering.
 */
export async function generateQrSvg(text: string, size: number = 100): Promise<string> {
  return QRCode.toString(text, {
    type: "svg",
    width: size,
    margin: 1,
    color: {
      dark: "#141416",
      light: "#FFFFFF",
    },
    errorCorrectionLevel: "M",
  });
}

/**
 * Generates a base64 Data URL of a QR Code for web images.
 */
export async function generateQrDataUrl(text: string, size: number = 140): Promise<string> {
  return QRCode.toDataURL(text, {
    width: size,
    margin: 1,
    color: {
      dark: "#141416",
      light: "#FFFFFF",
    },
    errorCorrectionLevel: "M",
  });
}
