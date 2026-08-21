/**
 * Normalizes image URLs for seamless Next.js Image Optimization.
 * Automatically extracts unwrapped direct URLs, fixes Google Drive/Dropbox links,
 * and eliminates double-proxy loops.
 */
export function normalizeImageUrl(url?: string | null): string {
  if (!url) return "";
  let trimmed = String(url).trim();
  if (!trimmed) return "";

  // 1. If wrapped in /api/proxy-image?url=..., extract the true underlying URL
  if (trimmed.includes("/api/proxy-image?url=") || trimmed.includes("/api/proxy-image")) {
    try {
      const parts = trimmed.split(/url=/i);
      if (parts[1]) {
        trimmed = decodeURIComponent(parts[1].split("&")[0]);
      }
    } catch {
      // ignore
    }
  }

  // 2. Data URLs & absolute local static uploads/assets
  if (trimmed.startsWith("data:") || trimmed.startsWith("/uploads") || trimmed.startsWith("/images") || trimmed.startsWith("/icons")) {
    return trimmed;
  }

  // 3. Google Images direct link (imgurl parameter)
  const imgUrlMatch = trimmed.match(/[?&]imgurl=([^&]+)/);
  if (imgUrlMatch && imgUrlMatch[1]) {
    try {
      trimmed = decodeURIComponent(imgUrlMatch[1]);
    } catch {
      trimmed = imgUrlMatch[1];
    }
  }

  // 4. Google Drive direct share IDs (drive.google.com/file/d/ID/... or id=ID)
  const gDriveMatch =
    trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
    trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (gDriveMatch && gDriveMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${gDriveMatch[1]}`;
  }

  // 5. Dropbox direct links (dl=0 -> raw=1 or dl.dropboxusercontent.com)
  if (trimmed.includes("dropbox.com")) {
    return trimmed
      .replace("www.dropbox.com", "dl.dropboxusercontent.com")
      .replace(/[?&]dl=[01]/, "");
  }

  return trimmed;
}
