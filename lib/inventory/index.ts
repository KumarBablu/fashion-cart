import { Prisma, InventoryTxnType } from "@prisma/client";

/**
 * Atomically decrements variant stock and logs an InventoryTransaction.
 * Uses a conditional update (WHERE stockQuantity >= qty) so concurrent
 * checkouts can never oversell a variant, even under race conditions.
 * Must be called inside a Prisma $transaction.
 */
export async function decrementStock(
  tx: Prisma.TransactionClient,
  variantId: string,
  quantity: number,
  opts: { type: InventoryTxnType; orderId?: string; notes?: string }
) {
  const result = await tx.productVariant.updateMany({
    where: { id: variantId, stockQuantity: { gte: quantity } },
    data: { stockQuantity: { decrement: quantity } },
  });

  if (result.count === 0) {
    throw new InsufficientStockError(variantId);
  }

  await tx.inventoryTransaction.create({
    data: {
      variantId,
      type: opts.type,
      quantity: -quantity,
      orderId: opts.orderId,
      notes: opts.notes,
    },
  });
}

export async function restockVariant(
  tx: Prisma.TransactionClient,
  variantId: string,
  quantity: number,
  opts: { type: InventoryTxnType; orderId?: string; notes?: string }
) {
  await tx.productVariant.update({
    where: { id: variantId },
    data: { stockQuantity: { increment: quantity } },
  });

  await tx.inventoryTransaction.create({
    data: {
      variantId,
      type: opts.type,
      quantity,
      orderId: opts.orderId,
      notes: opts.notes,
    },
  });
}

export const incrementStock = restockVariant;

export class InsufficientStockError extends Error {
  variantId: string;
  constructor(variantId: string) {
    super(`Insufficient stock for variant ${variantId}`);
    this.variantId = variantId;
  }
}
