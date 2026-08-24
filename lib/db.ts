import { PrismaClient } from "@prisma/client";

// Global cache for PrismaClient instances across development hot reload and serverless invocations
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaClients?: Record<string, PrismaClient>;
};

if (!globalForPrisma.prismaClients) {
  globalForPrisma.prismaClients = {};
}

/**
 * Optimizes database connection URLs with robust pool settings for Supabase PgBouncer.
 */
function optimizeDbUrl(url?: string): string | undefined {
  if (!url) return url;
  try {
    const parsed = new URL(url);
    if (parsed.port === "6543" || url.includes("pooler.supabase.com")) {
      if (!parsed.searchParams.has("pgbouncer")) {
        parsed.searchParams.set("pgbouncer", "true");
      }
      if (!parsed.searchParams.has("connection_limit")) {
        parsed.searchParams.set("connection_limit", "10");
      }
      if (!parsed.searchParams.has("pool_timeout")) {
        parsed.searchParams.set("pool_timeout", "20");
      }
      if (!parsed.searchParams.has("connect_timeout")) {
        parsed.searchParams.set("connect_timeout", "15");
      }
      return parsed.toString();
    }
    return url;
  } catch {
    return url;
  }
}

const defaultDbUrl = optimizeDbUrl(process.env.DATABASE_URL);

// 1. Default Primary Prisma Client (Garments / Default Store)
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: defaultDbUrl ? { db: { url: defaultDbUrl } } : undefined,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

globalForPrisma.prisma = prisma;
globalForPrisma.prismaClients["garments"] = prisma;
globalForPrisma.prismaClients["default"] = prisma;

/**
 * Returns the Prisma client for the requested store ("garments", "jewellery", etc.).
 * Dynamically resolves connection URLs from environment variables:
 * - "jewellery": JEWELLERY_DATABASE_URL (fashion-cart-jwellery Supabase DB)
 * - "garments": GARMENTS_DATABASE_URL or DATABASE_URL
 */
export function getDb(store: string = "garments"): PrismaClient {
  const normalized = store.toLowerCase().trim() || "garments";

  if (normalized === "garments" || normalized === "default") {
    return prisma;
  }

  // Check cached instance
  if (globalForPrisma.prismaClients![normalized]) {
    return globalForPrisma.prismaClients![normalized];
  }

  // Resolve target database URL
  let rawTargetUrl: string | undefined;
  if (normalized === "jewellery") {
    rawTargetUrl = process.env.JEWELLERY_DATABASE_URL || process.env.DATABASE_URL;
  } else {
    // Extensible for future stores e.g. "footwear" -> process.env.FOOTWEAR_DATABASE_URL
    const envVarName = `${normalized.toUpperCase()}_DATABASE_URL`;
    rawTargetUrl = process.env[envVarName] || process.env.DATABASE_URL;
  }

  if (!rawTargetUrl) {
    console.warn(`[getDb] Warning: No specific DB URL for store '${normalized}'. Falling back to default.`);
    return prisma;
  }

  // If the target URL is the exact same as default DATABASE_URL, reuse the default prisma instance
  if (rawTargetUrl === process.env.DATABASE_URL) {
    globalForPrisma.prismaClients![normalized] = prisma;
    return prisma;
  }

  const targetUrl = optimizeDbUrl(rawTargetUrl) || rawTargetUrl;

  const client = new PrismaClient({
    datasources: {
      db: { url: targetUrl },
    },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  globalForPrisma.prismaClients![normalized] = client;
  return client;
}
