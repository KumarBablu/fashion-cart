/**
 * Minimal in-memory rate limiter for authentication endpoints.
 *
 * NOTE: This is process-local. It is sufficient for a single-instance
 * deployment (e.g. the Version 1 setup running on one server/PC), but if
 * you later scale to multiple server instances, replace this with a
 * shared store (e.g. Redis) so limits apply across all instances.
 */

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10000;

function cleanupExpiredBuckets(now: number) {
  if (buckets.size < 500) return;
  for (const [k, v] of buckets.entries()) {
    if (v.resetAt < now) {
      buckets.delete(k);
    }
  }
}

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  
  if (buckets.size > MAX_BUCKETS) {
    cleanupExpiredBuckets(now);
  }

  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= limit) {
    return false;
  }

  bucket.count += 1;
  return true;
}

export function clientKeyFromRequest(req: Request, suffix: string): string {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  return `${ip}:${suffix}`;
}
