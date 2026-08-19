/**
 * Normalizes image URLs across various platforms (Google Drive, Google Share, Dropbox, Cloudinary, etc.)
 * so they load directly as raw images in browsers.
 */
export function normalizeImageUrl(url?: string | null): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (!trimmed) return "";

  // 1. Google Drive direct file IDs (e.g. drive.google.com/file/d/ID/... or id=ID)
  const gDriveMatch =
    trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
    trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (gDriveMatch && gDriveMatch[1]) {
    const fileId = gDriveMatch[1];
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }

  // 2. Google Share shortlinks (e.g. share.google/ID)
  const shareMatch = trimmed.match(/share\.google\/([a-zA-Z0-9_-]+)/);
  if (shareMatch && shareMatch[1]) {
    const fileId = shareMatch[1];
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }

  // 3. Dropbox direct links (dl=0 -> raw=1 or dl.dropboxusercontent.com)
  if (trimmed.includes("dropbox.com")) {
    return trimmed
      .replace("www.dropbox.com", "dl.dropboxusercontent.com")
      .replace(/[?&]dl=[01]/, "");
  }

  return trimmed;
}
