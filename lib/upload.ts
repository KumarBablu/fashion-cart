import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { ALLOWED_IMAGE_MIME_TYPES, MAX_UPLOAD_BYTES } from "@/lib/validation/schemas";

const UPLOAD_ROOT = path.join(process.cwd(), "uploads");

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export class UploadError extends Error {}

/**
 * Saves an uploaded image file to disk under uploads/<subdir>/ with a
 * cryptographically random, server-generated filename. The caller's
 * filename and extension are never trusted or used directly.
 */
export async function saveImageUpload(
  file: File,
  subdir: "products" | "payments"
): Promise<{ relativePath: string }> {
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type)) {
    throw new UploadError("Only JPG, PNG, and WebP images are allowed.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new UploadError("File is too large. Maximum size is 5 MB.");
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Verify the file actually starts with a matching magic number, not just
  // a spoofed Content-Type header.
  if (!looksLikeDeclaredType(buffer, file.type)) {
    throw new UploadError("The uploaded file does not match its declared image type.");
  }

  // On Vercel / serverless deployments, the filesystem is read-only.
  // Store uploaded image as a resilient Base64 Data URL so it saves directly in DB and displays everywhere.
  const isServerless = process.env.VERCEL === "1" || Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);
  if (isServerless) {
    const base64 = buffer.toString("base64");
    return { relativePath: `data:${file.type};base64,${base64}` };
  }

  try {
    const dir = path.join(UPLOAD_ROOT, subdir);
    await mkdir(dir, { recursive: true });

    const ext = EXT_BY_MIME[file.type] ?? "bin";
    const filename = `${Date.now()}-${crypto.randomBytes(16).toString("hex")}.${ext}`;
    const fullPath = path.join(dir, filename);

    await writeFile(fullPath, buffer);

    return { relativePath: path.posix.join(subdir, filename) };
  } catch {
    // Graceful fallback to Data URI if filesystem is restricted or read-only
    const base64 = buffer.toString("base64");
    return { relativePath: `data:${file.type};base64,${base64}` };
  }
}

function looksLikeDeclaredType(buffer: Buffer, mime: string): boolean {
  if (buffer.length < 4) return false;
  const sig = buffer.subarray(0, 4);
  if (mime === "image/png") {
    return sig[0] === 0x89 && sig[1] === 0x50 && sig[2] === 0x4e && sig[3] === 0x47;
  }
  if (mime === "image/jpeg" || mime === "image/jpg") {
    return sig[0] === 0xff && sig[1] === 0xd8;
  }
  if (mime === "image/webp") {
    return buffer.length >= 12 && buffer.toString("ascii", 8, 12) === "WEBP";
  }
  return false;
}
