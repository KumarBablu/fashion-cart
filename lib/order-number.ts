import { getDb } from "@/lib/db";

/**
 * Generates a sequential, store-isolated, human-friendly order/invoice number
 * (e.g. FC-GAR-2026-000001 for Garments, FC-JW-2026-000001 for Jewellery).
 * Uses an atomic upsert+increment on each respective store database.
 */
async function nextSequence(store: "garments" | "jewellery", counterId: string): Promise<number> {
  const db = getDb(store);
  const counter = await db.counter.upsert({
    where: { id: counterId },
    update: { value: { increment: 1 } },
    create: { id: counterId, value: 1 },
  });
  return counter.value;
}

export async function generateOrderNumber(store: "garments" | "jewellery" = "garments"): Promise<string> {
  const year = new Date().getFullYear();
  const seq = await nextSequence(store, `order-${store}-${year}`);
  const prefix = store === "jewellery" ? "FC-JW" : "FC-GAR";
  return `${prefix}-${year}-${String(seq).padStart(6, "0")}`;
}

export async function generateInvoiceNumber(store: "garments" | "jewellery" = "garments"): Promise<string> {
  const year = new Date().getFullYear();
  const seq = await nextSequence(store, `invoice-${store}-${year}`);
  const prefix = store === "jewellery" ? "FC-JWINV" : "FC-GARINV";
  return `${prefix}-${year}-${String(seq).padStart(6, "0")}`;
}
