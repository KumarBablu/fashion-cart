import { getDb } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { generateOrderNumber } from "@/lib/order-number";
import { decrementStock, InsufficientStockError } from "@/lib/inventory";
import { generateInvoiceBufferForOrder } from "@/lib/invoice/generate";
import { sendOrderPlacedEmail, sendPaymentVerifiedEmail } from "@/lib/email/service";
import { sendMobileSms, formatOrderPlacedSms } from "@/lib/notifications/sms";
import { getStoreUser } from "@/lib/auth/session";

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
 * Multi-Store Order Processor:
 * Creates an order from the user's active cart in Garments or Jewellery database.
 * Supports coupons, payment methods (MANUAL_UPI, COD, ONLINE_GATEWAY),
 * decrements stock atomically in that store's DB, and sends notifications.
 */
export async function createOrder(
  userId: string,
  addressId: string,
  options?: {
    couponCode?: string;
    paymentMethod?: "MANUAL_UPI" | "COD" | "ONLINE_GATEWAY";
    customerNotes?: string;
    store?: "garments" | "jewellery";
    variantId?: string;
    quantity?: number;
  }
) {
  const paymentMethod = options?.paymentMethod || "MANUAL_UPI";
  const isDirectBuy = Boolean(options?.variantId);

  let store: "garments" | "jewellery" = options?.store || "garments";
  let lineItems: Array<{
    productId: string;
    variantId: string;
    productNameSnapshot: string;
    colourSnapshot: string;
    sizeSnapshot: string;
    skuSnapshot: string;
    unitPrice: Prisma.Decimal;
    quantity: number;
    total: Prisma.Decimal;
  }> = [];

  let activeCart: any = null;

  if (isDirectBuy) {
    const buyQty = Math.max(1, Number(options?.quantity) || 1);
    let directVariant = await getDb(store).productVariant.findUnique({
      where: { id: options!.variantId },
      include: { product: true },
    });

    if (!directVariant) {
      const otherStore = store === "jewellery" ? "garments" : "jewellery";
      directVariant = await getDb(otherStore).productVariant.findUnique({
        where: { id: options!.variantId },
        include: { product: true },
      });
      if (directVariant) {
        store = otherStore;
      }
    }

    if (!directVariant || !directVariant.isActive || directVariant.product.status !== "ACTIVE") {
      throw new CheckoutError("OUT_OF_STOCK", "This product is no longer available.");
    }

    if (directVariant.stockQuantity < buyQty) {
      throw new CheckoutError("OUT_OF_STOCK", `Only ${directVariant.stockQuantity} items in stock for this size/colour.`);
    }

    const unitPrice = new Prisma.Decimal(directVariant.price);
    lineItems = [
      {
        productId: directVariant.productId,
        variantId: directVariant.id,
        productNameSnapshot: directVariant.product.name,
        colourSnapshot: directVariant.colour,
        sizeSnapshot: directVariant.size,
        skuSnapshot: directVariant.sku || directVariant.id,
        unitPrice,
        quantity: buyQty,
        total: unitPrice.mul(buyQty),
      },
    ];
  } else {
    // 1. Fetch user's cart from garments and jewellery databases
    const [garmentsCart, jewelleryCart] = await Promise.all([
      getDb("garments").cart.findUnique({
        where: { userId },
        include: { items: { include: { product: true, variant: true } } },
      }),
      getDb("jewellery").cart.findUnique({
        where: { userId },
        include: { items: { include: { product: true, variant: true } } },
      }),
    ]);

    const garmentsItems = garmentsCart?.items || [];
    const jewelleryItems = jewelleryCart?.items || [];

    // Determine active store for this order
    store = options?.store || (jewelleryItems.length > 0 ? "jewellery" : "garments");
    activeCart = store === "jewellery" ? jewelleryCart : garmentsCart;
    let cartItems = activeCart?.items || [];

    if (cartItems.length === 0) {
      // If chosen store cart is empty, check other store as fallback
      const altStore = store === "jewellery" ? "garments" : "jewellery";
      const altCart = altStore === "jewellery" ? jewelleryCart : garmentsCart;
      if (altCart && altCart.items.length > 0) {
        store = altStore;
        activeCart = altCart;
        cartItems = altCart.items;
      }
    }

    if (cartItems.length === 0) {
      throw new CheckoutError("CART_EMPTY", "Your cart is empty.");
    }

    // Check stock availability upfront
    for (const item of cartItems) {
      if (!item.variant.isActive || item.variant.stockQuantity < item.quantity) {
        throw new CheckoutError(
          "OUT_OF_STOCK",
          `Item "${item.product.name} (${item.variant.colour}/${item.variant.size})" has insufficient stock.`
        );
      }
    }

    // Prepare line items
    lineItems = cartItems.map((item: any) => {
      const unitPrice = new Prisma.Decimal(item.variant.price);
      const total = unitPrice.mul(item.quantity);
      return {
        productId: item.productId,
        variantId: item.variantId,
        productNameSnapshot: item.product.name,
        colourSnapshot: item.variant.colour,
        sizeSnapshot: item.variant.size,
        skuSnapshot: item.variant.sku || item.variant.id,
        unitPrice,
        quantity: item.quantity,
        total,
      };
    });
  }

  const db = getDb(store);

  // Ensure user exists in target store DB
  await getStoreUser(store);

  // Load selected delivery address
  let address = await db.address.findFirst({
    where: { id: addressId, userId },
  });

  if (!address) {
    // If not found in target store DB, look in the other DB and sync it
    const otherStore = store === "jewellery" ? "garments" : "jewellery";
    const srcAddress = await getDb(otherStore).address.findFirst({
      where: { id: addressId, userId },
    });
    if (srcAddress) {
      address = await db.address.upsert({
        where: { id: srcAddress.id },
        update: {
          fullName: srcAddress.fullName,
          mobileNumber: srcAddress.mobileNumber,
          addressLine1: srcAddress.addressLine1,
          addressLine2: srcAddress.addressLine2,
          city: srcAddress.city,
          state: srcAddress.state,
          pinCode: srcAddress.pinCode,
          landmark: srcAddress.landmark,
          isDefault: srcAddress.isDefault,
        },
        create: {
          id: srcAddress.id,
          userId,
          fullName: srcAddress.fullName,
          mobileNumber: srcAddress.mobileNumber,
          addressLine1: srcAddress.addressLine1,
          addressLine2: srcAddress.addressLine2,
          city: srcAddress.city,
          state: srcAddress.state,
          pinCode: srcAddress.pinCode,
          landmark: srcAddress.landmark,
          isDefault: srcAddress.isDefault,
        },
      });
    }
  }

  if (!address) {
    throw new CheckoutError("ADDRESS_NOT_FOUND", "Delivery address not found.");
  }

  const subtotal = lineItems.reduce((sum, item) => sum.add(item.total), new Prisma.Decimal(0));

  // Compute delivery fee
  const deliverySettings = await db.deliverySettings.findFirst().catch(() => null);
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
    const paymentSettings = await db.paymentSettings.findFirst({ where: { isActive: true } }).catch(() => null);
    if (paymentSettings?.codFee && Number(paymentSettings.codFee) > 0) {
      deliveryCharge = deliveryCharge.add(paymentSettings.codFee);
    }
  }

  // Validate coupon discount if provided
  let discount = new Prisma.Decimal(0);
  let appliedCouponId: string | undefined;
  let appliedCouponCode: string | undefined;

  if (options?.couponCode) {
    const coupon = await db.coupon.findUnique({
      where: { code: options.couponCode.trim().toUpperCase() },
    }).catch(() => null);

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
  const orderNumber = await generateOrderNumber(store);

  // Status mapping based on payment method
  const initialOrderStatus =
    paymentMethod === "COD"
      ? "CONFIRMED"
      : "PENDING_PAYMENT";

  const initialPaymentStatus = "PAYMENT_PENDING";

  try {
    const order = await db.$transaction(async (tx) => {
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
          verifiedAt: null,
        },
      });

      // Clear purchased items from user's cart immediately for COD orders
      if (paymentMethod === "COD") {
        const purchasedVariantIds = lineItems
          .map((i) => i.variantId)
          .filter((id): id is string => Boolean(id));
        if (purchasedVariantIds.length > 0) {
          const userCart = await tx.cart.findUnique({ where: { userId } });
          if (userCart) {
            await tx.cartItem.deleteMany({
              where: {
                cartId: userCart.id,
                variantId: { in: purchasedVariantIds },
              },
            });
          }
        }
      }

      return createdOrder;
    });

    // Dispatch background notifications asynchronously ONLY for confirmed orders
    if (order.status === "CONFIRMED") {
      void (async () => {
        try {
          const fullOrder = await db.order.findUnique({
            where: { id: order.id },
            include: { user: true, items: true, payment: true },
          });

          if (fullOrder) {
            sendOrderPlacedEmail(fullOrder).catch((err) => {
              console.error("Order placed email failed to dispatch:", err);
            });

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

            try {
              const { buffer, invoiceNumber } = await generateInvoiceBufferForOrder(order.id);
              sendPaymentVerifiedEmail(fullOrder, buffer, `FashionCart-Invoice-${order.orderNumber}-${invoiceNumber}.pdf`).catch((err) => {
                console.error("Payment verified email failed to dispatch:", err);
              });
            } catch (invoiceErr) {
              console.error("Invoice generation deferred:", invoiceErr);
            }
          }
        } catch (bgErr) {
          console.error("Background order notification error:", bgErr);
        }
      })();
    }

    return order;
  } catch (err) {
    if (err instanceof InsufficientStockError) {
      throw new CheckoutError("OUT_OF_STOCK", "One or more items went out of stock. Please review your cart.");
    }
    throw err;
  }
}
