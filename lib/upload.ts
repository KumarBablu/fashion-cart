import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { MAX_UPLOAD_BYTES } from "@/lib/validation/schemas";

const UPLOAD_ROOT = path.join(process.cwd(), "uploads");

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/pjpeg": "jpg",
  "image/jfif": "jpg",
  "image/png": "png",
  "image/x-png": "png",
  "image/webp": "webp",
};

export class UploadError extends Error {}

/**
 * Validates and saves an uploaded image file.
 * Handles JPG, PNG, and WebP, with automatic magic byte detection.
 * On serverless / Vercel, stores as a data URI or in uploads directory.
 */
export async function saveImageUpload(
  file: File,
  subdir: "products" | "payments"
): Promise<{ relativePath: string }> {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new UploadError("File is too large. Maximum size is 5 MB.");
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Auto-detect image format from file header magic bytes
  const detectedMime = detectImageMime(buffer) || normalizeMime(file.type);
  if (!detectedMime || !EXT_BY_MIME[detectedMime]) {
    throw new UploadError("Only JPG, PNG, and WebP images are supported.");
  }

  // On Vercel / serverless deployments, the local filesystem is read-only.
  // Storing as a standard Base64 Data URL ensures the image persists in PostgreSQL and renders anywhere.
  const isServerless = process.env.VERCEL === "1" || Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);
  if (isServerless) {
    const base64 = buffer.toString("base64");
    return { relativePath: `data:${detectedMime};base64,${base64}` };
  }

  try {
    const dir = path.join(UPLOAD_ROOT, subdir);
    await mkdir(dir, { recursive: true });

    const ext = EXT_BY_MIME[detectedMime] ?? "jpg";
    const filename = `${Date.now()}-${crypto.randomBytes(16).toString("hex")}.${ext}`;
    const fullPath = path.join(dir, filename);

    await writeFile(fullPath, buffer);

    return { relativePath: path.posix.join(subdir, filename) };
  } catch {
    // Graceful fallback to Data URI if filesystem is restricted or read-only
    const base64 = buffer.toString("base64");
    return { relativePath: `data:${detectedMime};base64,${base64}` };
  }
}

function normalizeMime(mime: string): string | null {
  const lower = (mime || "").toLowerCase().trim();
  if (lower === "image/jpeg" || lower === "image/jpg" || lower === "image/pjpeg" || lower === "image/jfif") return "image/jpeg";
  if (lower === "image/png" || lower === "image/x-png") return "image/png";
  if (lower === "image/webp") return "image/webp";
  return null;
}

function detectImageMime(buffer: Buffer): string | null {
  if (buffer.length < 4) return null;
  const sig = buffer.subarray(0, 4);

  // PNG: 89 50 4E 47
  if (sig[0] === 0x89 && sig[1] === 0x50 && sig[2] === 0x4e && sig[3] === 0x47) {
    return "image/png";
  }

  // JPEG: FF D8 FF
  if (sig[0] === 0xff && sig[1] === 0xd8) {
    return "image/jpeg";
  }

  // WebP: RIFF ... WEBP
  if (buffer.length >= 12 && buffer.toString("ascii", 8, 12) === "WEBP") {
    return "image/webp";
  }

  return null;
}
