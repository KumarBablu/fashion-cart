import { getDb } from "@/lib/db";

function getGatewayCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return null;
  return { keyId, keySecret };
}

function getAuthHeader(keyId: string, keySecret: string): string {
  const token = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  return `Basic ${token}`;
}

/**
 * Checks the live status of an online gateway payment directly with Razorpay.
 * If the payment has been refunded or partially refunded in Razorpay,
 * it automatically synchronizes the database payment & order records to ground truth.
 */
export async function syncOrderPaymentWithGateway(
  orderId: string,
  store: "garments" | "jewellery" = "garments"
): Promise<{
  synced: boolean;
  isRefunded: boolean;
  refundStatus?: string;
  refundId?: string;
  refundArn?: string | null;
}> {
  try {
    const creds = getGatewayCredentials();
    if (!creds) return { synced: false, isRefunded: false };

    const db = getDb(store);
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });

    if (!order || !order.payment || !order.payment.utrNumber) {
      return { synced: false, isRefunded: false };
    }

    const paymentId = order.payment.utrNumber;
    if (!paymentId.startsWith("pay_")) {
      return { synced: false, isRefunded: false };
    }

    // Query Razorpay API for live payment status
    const payRes = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
      headers: { Authorization: getAuthHeader(creds.keyId, creds.keySecret) },
      cache: "no-store",
    });

    if (!payRes.ok) {
      return { synced: false, isRefunded: false };
    }

    const payData = await payRes.json().catch(() => null);
    if (!payData) return { synced: false, isRefunded: false };

    const isRazorpayRefunded =
      payData.status === "refunded" ||
      Number(payData.amount_refunded || 0) > 0 ||
      payData.refund_status === "full" ||
      payData.refund_status === "partial";

    if (!isRazorpayRefunded) {
      return { synced: true, isRefunded: false };
    }

    // Fetch refund list from Razorpay
    const rfRes = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/refunds`, {
      headers: { Authorization: getAuthHeader(creds.keyId, creds.keySecret) },
      cache: "no-store",
    });

    let refundItem: any = null;
    if (rfRes.ok) {
      const rfList = await rfRes.json().catch(() => null);
      if (rfList?.items && rfList.items.length > 0) {
        refundItem = rfList.items[0];
      }
    }

    const refundId = refundItem?.id || order.payment.refundId || `rfnd_sync_${paymentId}`;
    const rawStatus = (refundItem?.status || "processed").toUpperCase();
    const refundStatus = rawStatus === "PROCESSED" ? "PROCESSED" : "INITIATED";
    const refundAmount = refundItem?.amount
      ? Number(refundItem.amount) / 100
      : Number(payData.amount_refunded || 0) / 100 || Number(order.total);
    const refundArn =
      refundItem?.acquirer_data?.rrn ||
      refundItem?.acquirer_data?.arn ||
      refundItem?.acquirer_data?.bank_transaction_id ||
      order.payment.refundArn ||
      null;
    const refundSpeed = refundItem?.speed_processed || refundItem?.speed_requested || "instant";
    const refundCreatedAt = refundItem?.created_at
      ? new Date(refundItem.created_at * 1000)
      : order.payment.refundCreatedAt || new Date();
    const refundCompletedAt = rawStatus === "PROCESSED" ? new Date() : null;

    // Check if database already matches
    const needsUpdate =
      order.payment.refundStatus !== refundStatus ||
      order.payment.refundId !== refundId ||
      (refundStatus === "PROCESSED" && order.status !== "REFUNDED") ||
      (!order.payment.refundArn && refundArn);

    if (needsUpdate) {
      await db.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: order.payment!.id },
          data: {
            refundId,
            refundStatus,
            refundAmount,
            refundArn,
            refundSpeed,
            refundCreatedAt,
            refundCompletedAt: refundCompletedAt || undefined,
            refundNotes: refundItem?.notes?.reason || order.payment!.refundNotes || "Synchronized from Razorpay Gateway",
          },
        });

        await tx.order.update({
          where: { id: order.id },
          data: {
            status: refundStatus === "PROCESSED" ? "REFUNDED" : "REFUND_PENDING",
            cancellationStatus: "COMPLETED",
            cancelledAt: order.cancelledAt || refundCreatedAt,
            cancelReason: order.cancelReason || "Order Cancelled & Refunded via Gateway",
          },
        });
      });
      console.log(`[Gateway Sync] Order #${order.orderNumber} successfully synchronized to ${refundStatus} (${refundId})`);
    }

    return {
      synced: true,
      isRefunded: true,
      refundStatus,
      refundId,
      refundArn,
    };
  } catch (err) {
    console.error("[Gateway Sync] Error syncing payment with gateway:", err);
    return { synced: false, isRefunded: false };
  }
}
