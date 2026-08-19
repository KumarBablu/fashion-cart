import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { generateOrderNumber } from "@/lib/order-number";
import { decrementStock, InsufficientStockError } from "@/lib/inventory";
import { generateInvoiceBufferForOrder } from "@/lib/invoice/generate";
import { sendOrderPlacedEmail, sendPaymentVerifiedEmail } from "@/lib/email/service";
import { sendMobileSms, formatOrderPlacedSms } from "@/lib/notifications/sms";

export class CheckoutError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export const createOrderFromCart = (args: {
  userId: string;
  addressId: string;
  couponCode?: string;
  paymentMethod?: "MANUAL_UPI" | "COD" | "ONLINE_GATEWAY";
  customerNotes?: string;
}) => createOrder(args.userId, args.addressId, args);

/**
 * Creates an order from the user's current cart and delivery address.
 * Supports coupons, multi-payment methods (MANUAL_UPI, COD, ONLINE_GATEWAY),
 * decrements stock atomically, generates PDF invoice, and sends email confirmation.
 */
export async function createOrder(
  userId: string,
  addressId: string,
  options?: {
    couponCode?: string;
    paymentMethod?: "MANUAL_UPI" | "COD" | "ONLINE_GATEWAY";
    customerNotes?: string;
  }
) {
  const paymentMethod = options?.paymentMethod || "MANUAL_UPI";

  // Load the user's active cart with product snapshots
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: true,
          variant: true,
        },
      },
    },
  });

  if (!cart || cart.items.length === 0) {
    throw new CheckoutError("CART_EMPTY", "Your cart is empty.");
  }

  // Load the selected delivery address
  const address = await prisma.address.findFirst({
    where: { id: addressId, userId },
  });

  if (!address) {
    throw new CheckoutError("ADDRESS_NOT_FOUND", "Delivery address not found.");
  }

  // Check stock availability upfront
  for (const item of cart.items) {
    if (!item.variant.isActive || item.variant.stockQuantity < item.quantity) {
      throw new CheckoutError(
        "OUT_OF_STOCK",
        `Item "${item.product.name} (${item.variant.colour}/${item.variant.size})" has insufficient stock.`
      );
    }
  }

  // Prepare line items
  const lineItems = cart.items.map((item) => {
    const unitPrice = item.variant.price;
    const total = unitPrice.mul(item.quantity);
    return {
      productId: item.productId,
      variantId: item.variantId,
      productNameSnapshot: item.product.name,
      colourSnapshot: item.variant.colour,
      sizeSnapshot: item.variant.size,
      skuSnapshot: item.variant.sku,
      unitPrice,
      quantity: item.quantity,
      total,
    };
  });

  const subtotal = lineItems.reduce((sum, item) => sum.add(item.total), new Prisma.Decimal(0));

  // Compute delivery fee
  const deliverySettings = await prisma.deliverySettings.findFirst();
  let deliveryCharge = new Prisma.Decimal(49);
  if (deliverySettings) {
    if (deliverySettings.freeDeliveryAbove && subtotal.gte(deliverySettings.freeDeliveryAbove)) {
      deliveryCharge = new Prisma.Decimal(0);
    } else {
      deliveryCharge = deliverySettings.defaultCharge;
    }
  } else if (subtotal.gte(999)) {
    deliveryCharge = new Prisma.Decimal(0);
  }

  // Add COD fee if applicable
  if (paymentMethod === "COD") {
    const paymentSettings = await prisma.paymentSettings.findFirst({ where: { isActive: true } });
    if (paymentSettings?.codFee && Number(paymentSettings.codFee) > 0) {
      deliveryCharge = deliveryCharge.add(paymentSettings.codFee);
    }
  }

  // Validate coupon discount if provided
  let discount = new Prisma.Decimal(0);
  let appliedCouponId: string | undefined;
  let appliedCouponCode: string | undefined;

  if (options?.couponCode) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: options.couponCode.trim().toUpperCase() },
    });

    if (coupon && coupon.isActive) {
      const isNotExpired = !coupon.endDate || new Date(coupon.endDate) >= new Date();
      const withinLimit = !coupon.usageLimit || coupon.usedCount < coupon.usageLimit;
      const meetsMin = !coupon.minOrderAmount || subtotal.gte(coupon.minOrderAmount);

      if (isNotExpired && withinLimit && meetsMin) {
        appliedCouponId = coupon.id;
        appliedCouponCode = coupon.code;
        if (coupon.discountType === "PERCENTAGE") {
          let calc = subtotal.mul(coupon.discountValue).div(100);
          if (coupon.maxDiscountAmount && calc.gt(coupon.maxDiscountAmount)) {
            calc = coupon.maxDiscountAmount;
          }
          discount = calc;
        } else {
          discount = coupon.discountValue;
        }
        if (discount.gt(subtotal)) {
          discount = subtotal;
        }
      }
    }
  }

  const tax = new Prisma.Decimal(0);
  const total = subtotal.sub(discount).add(deliveryCharge).add(tax);
  const orderNumber = await generateOrderNumber();

  // Status mapping based on payment method
  const initialOrderStatus =
    paymentMethod === "ONLINE_GATEWAY"
      ? "CONFIRMED"
      : paymentMethod === "COD"
      ? "CONFIRMED"
      : "PENDING_PAYMENT";

  const initialPaymentStatus =
    paymentMethod === "ONLINE_GATEWAY"
      ? "VERIFIED"
      : "PAYMENT_PENDING";

  try {
    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          status: initialOrderStatus,
          paymentMethod,
          subtotal,
          discount,
          deliveryCharge,
          tax,
          total,
          couponId: appliedCouponId,
          couponCode: appliedCouponCode,
          couponDiscount: discount.gt(0) ? discount : undefined,
          customerNotes: options?.customerNotes,
          shippingAddressSnapshot: {
            fullName: address.fullName,
            mobileNumber: address.mobileNumber,
            addressLine1: address.addressLine1,
            addressLine2: address.addressLine2,
            city: address.city,
            state: address.state,
            pinCode: address.pinCode,
            landmark: address.landmark,
          },
          items: {
            create: lineItems,
          },
        },
      });

      // Increment coupon usage count
      if (appliedCouponId) {
        await tx.coupon.update({
          where: { id: appliedCouponId },
          data: { usedCount: { increment: 1 } },
        });
      }

      // Reserve stock immediately
      for (const item of lineItems) {
        await decrementStock(tx, item.variantId, item.quantity, {
          type: "SALE",
          orderId: createdOrder.id,
          notes: `Reserved for order ${orderNumber} (${paymentMethod})`,
        });
      }

      // Create Payment record
      await tx.payment.create({
        data: {
          orderId: createdOrder.id,
          method: paymentMethod === "COD" ? "COD" : paymentMethod === "ONLINE_GATEWAY" ? "ONLINE_GATEWAY" : "MANUAL_UPI",
          amount: total,
          status: initialPaymentStatus,
          verifiedAt: initialPaymentStatus === "VERIFIED" ? new Date() : null,
        },
      });

      // Clear the user's cart
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return createdOrder;
    });

    // Dispatch notifications asynchronously in the background so checkout returns instantly (<50ms)
    void (async () => {
      try {
        const fullOrder = await prisma.order.findUnique({
          where: { id: order.id },
          include: { user: true, items: true, payment: true },
        });

        if (fullOrder) {
          // 1. Send Order Placed Email to customer & Admin
          sendOrderPlacedEmail(fullOrder).catch((err) => {
            console.error("Order placed email failed to dispatch:", err);
          });

          // 2. Dispatch Mobile SMS to customer
          const phone = fullOrder.user.phone || (fullOrder.shippingAddressSnapshot as any)?.mobileNumber;
          if (phone) {
            sendMobileSms({
              to: phone,
              message: formatOrderPlacedSms(fullOrder),
              templateType: "ORDER_PLACED",
            }).catch((smsErr) => {
              console.error("Order placed SMS failed to dispatch:", smsErr);
            });
          }

          // 3. If verified immediately (e.g. online simulated / COD), generate in-memory PDF invoice and send confirmed email
          if (order.status === "CONFIRMED") {
            try {
              const { buffer, invoiceNumber } = await generateInvoiceBufferForOrder(order.id);
              sendPaymentVerifiedEmail(fullOrder, buffer, `FashionCart-Invoice-${order.orderNumber}-${invoiceNumber}.pdf`).catch((err) => {
                console.error("Payment verified email failed to dispatch:", err);
              });
            } catch (invoiceErr) {
              console.error("Invoice generation deferred:", invoiceErr);
            }
          }
        }
      } catch (bgErr) {
        console.error("Background order notification error:", bgErr);
      }
    })();

    return order;
  } catch (err) {
    if (err instanceof InsufficientStockError) {
      throw new CheckoutError("OUT_OF_STOCK", "One or more items went out of stock. Please review your cart.");
    }
    throw err;
  }
}
