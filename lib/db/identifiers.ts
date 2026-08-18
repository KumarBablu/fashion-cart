import { prisma } from "@/lib/db";

/**
 * Generates human-identifiable, sequential standard IDs for all database models
 * Examples:
 *  - Customer: FC-USR-000001
 *  - Admin:    FC-ADM-000001
 *  - Order:    FC-ORD-2026-000001
 *  - Invoice:  INV-2026-000001
 *  - Payment:  PAY-2026-000001
 *  - Address:  ADDR-000001
 */

export async function generateStandardUserId(role: "ADMIN" | "CUSTOMER" = "CUSTOMER"): Promise<string> {
  const prefix = role === "ADMIN" ? "FC-ADM" : "FC-USR";
  try {
    const totalUsers = await prisma.user.count({ where: { role } });
    const nextSeq = totalUsers + 1;
    let candidate = `${prefix}-${String(nextSeq).padStart(6, "0")}`;

    // Verify uniqueness in case of deleted records
    let exists = await prisma.user.findUnique({ where: { id: candidate } });
    let attempts = 0;
    while (exists && attempts < 100) {
      attempts++;
      candidate = `${prefix}-${String(nextSeq + attempts).padStart(6, "0")}`;
      exists = await prisma.user.findUnique({ where: { id: candidate } });
    }
    return candidate;
  } catch {
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${randomHex}`;
  }
}

export async function generateStandardAddressId(): Promise<string> {
  try {
    const count = await prisma.address.count();
    const nextSeq = count + 1;
    let candidate = `ADDR-${String(nextSeq).padStart(6, "0")}`;
    let exists = await prisma.address.findUnique({ where: { id: candidate } });
    let attempts = 0;
    while (exists && attempts < 100) {
      attempts++;
      candidate = `ADDR-${String(nextSeq + attempts).padStart(6, "0")}`;
      exists = await prisma.address.findUnique({ where: { id: candidate } });
    }
    return candidate;
  } catch {
    return `ADDR-${Date.now().toString().slice(-6)}`;
  }
}

export function generateStandardCategoryId(slug: string): string {
  const cleanSlug = slug.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `CAT-${cleanSlug}`;
}

export function generateStandardProductId(slug: string): string {
  const cleanSlug = slug.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `PRD-${cleanSlug}`;
}
