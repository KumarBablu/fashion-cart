import { PrismaClient } from "@prisma/client";

// Global cache for PrismaClient instances across development hot reload and serverless invocations
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaClients?: Record<string, PrismaClient>;
};

if (!globalForPrisma.prismaClients) {
  globalForPrisma.prismaClients = {};
}

// 1. Default Primary Prisma Client (Garments / Default Store)
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
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
  let targetUrl: string | undefined;
  if (normalized === "jewellery") {
    targetUrl = process.env.JEWELLERY_DATABASE_URL || process.env.DATABASE_URL;
  } else {
    // Extensible for future stores e.g. "footwear" -> process.env.FOOTWEAR_DATABASE_URL
    const envVarName = `${normalized.toUpperCase()}_DATABASE_URL`;
    targetUrl = process.env[envVarName] || process.env.DATABASE_URL;
  }

  if (!targetUrl) {
    console.warn(`[getDb] Warning: No specific DB URL for store '${normalized}'. Falling back to default.`);
    return prisma;
  }

  // If the target URL is the exact same as default DATABASE_URL, reuse the default prisma instance
  if (targetUrl === process.env.DATABASE_URL) {
    globalForPrisma.prismaClients![normalized] = prisma;
    return prisma;
  }

  const client = new PrismaClient({
    datasources: {
      db: { url: targetUrl },
    },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  globalForPrisma.prismaClients![normalized] = client;
  return client;
}
