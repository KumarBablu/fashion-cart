import { getDb } from "../lib/db";
import { fetchRazorpayPayment, parseRazorpayPaymentInstrument } from "../lib/payments/razorpay";
import dotenv from "dotenv";

dotenv.config();

async function backfillOrderPayment() {
  const db = getDb("garments");
  const order = await db.order.findFirst({
    where: { orderNumber: "FC-GAR-2026-000003" },
    include: { payment: true },
  });

  if (!order || !order.payment) {
    console.log("Order or payment not found");
    return;
  }

  console.log("Found order payment with UTR:", order.payment.utrNumber);

  let gatewayName = "Razorpay";
  let paymentChannel = "NETBANKING";
  let instrumentDetails = "Bank of Baroda Netbanking";
  let paymentMetadata: any = null;

  if (order.payment.utrNumber) {
    try {
      const rzpPayment = await fetchRazorpayPayment(order.payment.utrNumber);
      if (rzpPayment) {
        paymentMetadata = rzpPayment;
        const parsed = parseRazorpayPaymentInstrument(rzpPayment);
        gatewayName = parsed.gatewayName;
        paymentChannel = parsed.paymentChannel;
        instrumentDetails = parsed.instrumentDetails;
      }
    } catch (e) {
      console.log("Razorpay fetch info:", e);
    }
  }

  await db.payment.update({
    where: { id: order.payment.id },
    data: {
      gatewayName,
      paymentChannel,
      instrumentDetails,
      paymentMetadata: paymentMetadata || undefined,
    },
  });

  await db.order.update({
    where: { id: order.id },
    data: {
      paymentMethod: `ONLINE_GATEWAY (${gatewayName} · ${paymentChannel})`,
    },
  });

  console.log("✅ Successfully updated payment & order with rich channel & instrument data:", {
    gatewayName,
    paymentChannel,
    instrumentDetails,
  });
}

backfillOrderPayment().catch(console.error);
