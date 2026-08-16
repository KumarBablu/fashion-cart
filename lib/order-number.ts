import { prisma } from "@/lib/db";

/**
 * Generates a sequential, human-friendly, customer-facing number
 * (e.g. FC-ORD-2026-000001) without ever exposing raw database IDs.
 * Uses an atomic upsert+increment so concurrent requests never collide.
 */
async function nextSequence(counterId: string): Promise<number> {
  const counter = await prisma.counter.upsert({
    where: { id: counterId },
    update: { value: { increment: 1 } },
    create: { id: counterId, value: 1 },
  });
  return counter.value;
}

export async function generateOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const seq = await nextSequence(`order-${year}`);
  return `FC-ORD-${year}-${String(seq).padStart(6, "0")}`;
}

export async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const seq = await nextSequence(`invoice-${year}`);
  return `FC-INV-${year}-${String(seq).padStart(6, "0")}`;
}
