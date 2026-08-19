/**
 * Normalizes image URLs across ANY platform on the internet (Google Drive, Google Share, WordPress, Dropbox, external sites, etc.)
 * by routing external web images through our high-performance universal image proxy.
 */
export function normalizeImageUrl(url?: string | null): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (!trimmed) return "";

  // 1. Data URLs (uploaded files in Base64) & local relative assets
  if (trimmed.startsWith("data:") || trimmed.startsWith("/") || trimmed.startsWith("./")) {
    return trimmed;
  }

  // 2. Google Images link with imgurl parameter (e.g. google.com/imgres?imgurl=https://...)
  const imgUrlMatch = trimmed.match(/[?&]imgurl=([^&]+)/);
  if (imgUrlMatch && imgUrlMatch[1]) {
    try {
      const decoded = decodeURIComponent(imgUrlMatch[1]);
      return `/api/proxy-image?url=${encodeURIComponent(decoded)}`;
    } catch {
      return `/api/proxy-image?url=${encodeURIComponent(imgUrlMatch[1])}`;
    }
  }

  // 3. Google Drive direct file IDs (e.g. drive.google.com/file/d/ID/... or id=ID)
  const gDriveMatch =
    trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
    trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (gDriveMatch && gDriveMatch[1]) {
    const fileId = gDriveMatch[1];
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }

  // 4. Google Share shortlinks (e.g. share.google/ID)
  const shareMatch = trimmed.match(/share\.google\/([a-zA-Z0-9_-]+)/);
  if (shareMatch && shareMatch[1]) {
    return `/api/proxy-image?url=${encodeURIComponent(trimmed)}`;
  }

  // 5. Dropbox direct links (dl=0 -> raw=1 or dl.dropboxusercontent.com)
  if (trimmed.includes("dropbox.com")) {
    const directDropbox = trimmed
      .replace("www.dropbox.com", "dl.dropboxusercontent.com")
      .replace(/[?&]dl=[01]/, "");
    return `/api/proxy-image?url=${encodeURIComponent(directDropbox)}`;
  }

  // 6. Any external HTTP/HTTPS URL -> route through universal proxy to bypass CORS & hotlink blocking
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return `/api/proxy-image?url=${encodeURIComponent(trimmed)}`;
  }

  return trimmed;
}
