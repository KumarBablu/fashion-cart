import { getDb, prisma } from "@/lib/db";
import { ShiprocketAdapter } from "./shiprocket-adapter";
import { ManualAdapter } from "./manual-adapter";
import { ICourierProvider, CourierRateOption, CreateShipmentResult, ShipmentLifecycleStatus } from "./types";
import { generateShippingLabelPdf } from "./label-generator";
import { sendOrderShippedEmail } from "@/lib/email/service";
import { sendMobileSms, formatOrderShippedSms } from "@/lib/notifications/sms";

/**
 * Returns the configured logistics adapter based on active settings.
 */
export async function getLogisticsProvider(): Promise<ICourierProvider> {
  try {
    const settings = await prisma.logisticsSettings.findFirst();
    if (settings && settings.provider === "manual") {
      return new ManualAdapter();
    }
    return new ShiprocketAdapter({
      email: settings?.apiEmail,
      password: settings?.apiPassword,
      token: settings?.authToken,
      isSandbox: settings?.environment === "sandbox",
    });
  } catch {
    return new ShiprocketAdapter();
  }
}

/**
 * Resolves or initializes default Pickup Location.
 */
export async function getDefaultPickupLocation(store: "garments" | "jewellery" = "garments") {
  const db = getDb(store);
  let location = await db.pickupLocation.findFirst({
    where: {
      OR: [{ store }, { store: "all" }],
      isActive: true,
      isDefault: true,
    },
  });

  if (!location) {
    location = await db.pickupLocation.findFirst({
      where: {
        OR: [{ store }, { store: "all" }],
        isActive: true,
      },
    });
  }

  if (!location) {
    // Auto-create standard primary hub
    location = await db.pickupLocation.create({
      data: {
        locationCode: `HUB-${store.toUpperCase()}-01`,
        store: "all",
        nickname: "Primary Logistics Dispatch Hub",
        contactPerson: "Fashion Cart Logistics",
        phone: "9876543210",
        addressLine1: "Ring Road Textile & Jewellery Hub",
        city: "Surat",
        state: "Gujarat",
        pinCode: "395002",
        isDefault: true,
      },
    });
  }

  return location;
}

/**
 * Calculates estimated package weight for an order based on items and store defaults.
 */
export async function calculateOrderWeight(items: any[], store: "garments" | "jewellery" = "garments"): Promise<number> {
  const settings = await prisma.logisticsSettings.findFirst();
  const defaultGarment = Number(settings?.defaultGarmentWeight || 0.6);
  const defaultJewel = Number(settings?.defaultJewelWeight || 0.15);

  const baseUnitWeight = store === "jewellery" ? defaultJewel : defaultGarment;
  const totalUnits = items.reduce((acc, it) => acc + (it.quantity || 1), 0);
  return Number(Math.max(0.1, totalUnits * baseUnitWeight).toFixed(3));
}

/**
 * Live Courier Rates & Options for a specific Order.
 */
export async function getOrderCourierRates(orderId: string, store: "garments" | "jewellery" = "garments"): Promise<{
  rates: CourierRateOption[];
  pickupPincode: string;
  deliveryPincode: string;
  weightKg: number;
}> {
  const db = getDb(store);
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: true, payment: true },
  });

  if (!order) throw new Error("Order not found");

  const addr = order.shippingAddressSnapshot as any;
  const pickup = await getDefaultPickupLocation(store);
  const weightKg = await calculateOrderWeight(order.items, store);
  const isCod = order.paymentMethod === "COD" || order.payment?.method === "COD";

  const provider = await getLogisticsProvider();
  const rates = await provider.checkServiceability({
    pickupPincode: pickup.pinCode,
    deliveryPincode: addr.pinCode,
    weightKg,
    isCod,
    orderTotal: Number(order.total),
  });

  return {
    rates,
    pickupPincode: pickup.pinCode,
    deliveryPincode: addr.pinCode,
    weightKg,
  };
}

/**
 * 1-Click Autonomous Order Fulfillment
 */
export async function fulfillOrder(
  orderId: string,
  preferredCourierId?: string | number,
  store: "garments" | "jewellery" = "garments"
): Promise<{ success: boolean; shipment: any; message: string }> {
  let db = getDb(store);
  let order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      user: true,
      items: true,
      payment: true,
      shipment: true,
    },
  });

  if (!order && store === "garments") {
    const jwDb = getDb("jewellery");
    order = await jwDb.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        items: true,
        payment: true,
        shipment: true,
      },
    });
    if (order) {
      db = jwDb;
      store = "jewellery";
    }
  }

  if (!order) throw new Error("Order not found");

  const addr = order.shippingAddressSnapshot as any;
  const pickup = await getDefaultPickupLocation(store);
  const weightKg = await calculateOrderWeight(order.items, store);
  const isCod = order.paymentMethod === "COD" || order.payment?.method === "COD";

  const provider = await getLogisticsProvider();

  // Create Shipment with Courier
  const result: CreateShipmentResult = await provider.createShipment({
    orderId: order.id,
    orderNumber: order.orderNumber,
    store,
    pickupLocationId: pickup.locationCode,
    customerName: addr.fullName || order.user.name,
    customerPhone: addr.mobileNumber || order.user.phone || "9999999999",
    customerEmail: order.user.email,
    shippingAddress: addr,
    items: order.items.map((it) => ({
      name: it.productNameSnapshot,
      sku: it.skuSnapshot,
      quantity: it.quantity,
      unitPrice: Number(it.unitPrice),
    })),
    subtotal: Number(order.subtotal),
    discount: Number(order.discount),
    tax: Number(order.tax),
    total: Number(order.total),
    isCod,
    packageWeightKg: weightKg,
    preferredCourierId,
  });

  if (!result.success || !result.awbNumber) {
    throw new Error(result.error || "Failed to generate AWB with courier partner");
  }

  // Schedule Doorstep Pickup
  const pickupSchedule = await provider.schedulePickup(result.shipmentIdExternal || result.awbNumber);

  // Persist / Upsert Shipment in Database
  const shipment = await db.shipment.upsert({
    where: { orderId: order.id },
    create: {
      orderId: order.id,
      pickupLocationId: pickup.id,
      carrierCode: result.courierCode,
      carrierName: result.courierName,
      awbNumber: result.awbNumber,
      shipmentIdExternal: result.shipmentIdExternal,
      orderIdExternal: result.orderIdExternal,
      routingCode: result.routingCode,
      packageWeightKg: weightKg,
      shippingCost: result.shippingCost,
      status: "AWB_ASSIGNED",
      statusDescription: "AWB assigned. Pickup scheduled with courier.",
      pickupToken: pickupSchedule.token || result.pickupToken,
      pickupScheduledDate: new Date(),
      estimatedDelivery: result.estimatedDelivery,
      activities: {
        create: {
          status: "AWB_ASSIGNED",
          location: `${pickup.city} Hub`,
          description: `Shipment booked with ${result.courierName}. AWB: ${result.awbNumber}`,
        },
      },
    },
    update: {
      carrierCode: result.courierCode,
      carrierName: result.courierName,
      awbNumber: result.awbNumber,
      shipmentIdExternal: result.shipmentIdExternal,
      routingCode: result.routingCode,
      packageWeightKg: weightKg,
      shippingCost: result.shippingCost,
      status: "AWB_ASSIGNED",
      pickupToken: pickupSchedule.token || result.pickupToken,
      pickupScheduledDate: new Date(),
      estimatedDelivery: result.estimatedDelivery,
      updatedAt: new Date(),
    },
  });

  // Update Order status to PACKED & record tracking
  await db.order.update({
    where: { id: order.id },
    data: {
      carrierName: result.courierName,
      trackingNumber: result.awbNumber,
      status: order.status === "CONFIRMED" || order.status === "PROCESSING" ? "PACKED" : order.status,
    },
  });

  return {
    success: true,
    shipment,
    message: `Shipment created with ${result.courierName}. AWB: ${result.awbNumber}`,
  };
}

/**
 * 1-Click Batch Order Fulfillment
 */
export async function batchFulfillOrders(orderIds: string[], store: "garments" | "jewellery" = "garments") {
  const results = [];
  for (const id of orderIds) {
    try {
      const res = await fulfillOrder(id, undefined, store);
      results.push({ orderId: id, success: true, awb: res.shipment.awbNumber });
    } catch (err: any) {
      results.push({ orderId: id, success: false, error: err.message || "Failed" });
    }
  }
  return results;
}

/**
 * Handles Webhook Tracking updates pushed by couriers.
 */
export async function processLogisticsWebhook(
  awbNumber: string,
  eventStatus: string,
  location?: string,
  activityDesc?: string,
  rawPayload?: any
) {
  let targetStore: "garments" | "jewellery" = "garments";
  let shipment = await getDb("garments").shipment.findUnique({
    where: { awbNumber },
    include: { order: { include: { user: true } } },
  });

  if (!shipment) {
    shipment = await getDb("jewellery").shipment.findUnique({
      where: { awbNumber },
      include: { order: { include: { user: true } } },
    });
    if (shipment) targetStore = "jewellery";
  }

  if (!shipment) {
    console.warn(`[LogisticsWebhook] No shipment found for AWB: ${awbNumber}`);
    return { error: "Shipment not found" };
  }

  const db = getDb(targetStore);
  const normalized = eventStatus.toUpperCase();

  let mappedStatus: ShipmentLifecycleStatus = shipment.status as ShipmentLifecycleStatus;
  let orderStatusUpdate: any = undefined;

  if (normalized.includes("PICKED") || normalized.includes("IN TRANSIT") || normalized.includes("SHIPPED")) {
    mappedStatus = "IN_TRANSIT";
    orderStatusUpdate = "SHIPPED";
  } else if (normalized.includes("OUT FOR DELIVERY") || normalized.includes("OUT_FOR_DELIVERY")) {
    mappedStatus = "OUT_FOR_DELIVERY";
    orderStatusUpdate = "SHIPPED";
  } else if (normalized.includes("DELIVERED")) {
    mappedStatus = "DELIVERED";
    orderStatusUpdate = "DELIVERED";
  } else if (normalized.includes("UNDELIVERED") || normalized.includes("FAILED") || normalized.includes("NDR")) {
    mappedStatus = "FAILED_ATTEMPT";
  } else if (normalized.includes("RTO")) {
    mappedStatus = "RTO_INITIATED";
  }

  // Update Shipment & Log Activity
  await db.$transaction([
    db.shipment.update({
      where: { id: shipment.id },
      data: {
        status: mappedStatus,
        statusDescription: activityDesc || eventStatus,
        shippedAt: mappedStatus === "IN_TRANSIT" && !shipment.shippedAt ? new Date() : undefined,
        deliveredAt: mappedStatus === "DELIVERED" ? new Date() : undefined,
      },
    }),
    db.shipmentActivity.create({
      data: {
        shipmentId: shipment.id,
        status: mappedStatus,
        location: location || "Transit Hub",
        description: activityDesc || `Shipment update: ${eventStatus}`,
        rawPayload: rawPayload ? rawPayload : undefined,
      },
    }),
    ...(orderStatusUpdate
      ? [
          db.order.update({
            where: { id: shipment.orderId },
            data: { status: orderStatusUpdate },
          }),
        ]
      : []),
  ]);

  // Trigger automated customer notifications on status transition
  if (orderStatusUpdate === "SHIPPED") {
    sendOrderShippedEmail(shipment.order).catch(console.error);
    const phone = shipment.order.user.phone || (shipment.order.shippingAddressSnapshot as any)?.mobileNumber;
    if (phone) {
      sendMobileSms({
        to: phone,
        message: formatOrderShippedSms(shipment.order),
        templateType: "ORDER_SHIPPED",
      }).catch(console.error);
    }
  }

  return { success: true, updatedStatus: mappedStatus };
}

/**
 * Generates combined 4x6 thermal shipping label PDF for an order.
 */
export async function getOrderShippingLabelPdf(orderId: string, store: "garments" | "jewellery" = "garments"): Promise<Buffer> {
  let db = getDb(store);
  let order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: true, payment: true, shipment: { include: { pickupLocation: true } } },
  });

  if (!order && store === "garments") {
    order = await getDb("jewellery").order.findUnique({
      where: { id: orderId },
      include: { items: true, payment: true, shipment: { include: { pickupLocation: true } } },
    });
    if (order) store = "jewellery";
  }

  if (!order) throw new Error("Order not found");

  const addr = order.shippingAddressSnapshot as any;
  const pickup = order.shipment?.pickupLocation || (await getDefaultPickupLocation(store));
  const isCod = order.paymentMethod === "COD" || order.payment?.method === "COD";
  const awb = order.shipment?.awbNumber || order.trackingNumber || `AWB-${order.orderNumber}`;
  const carrier = order.shipment?.carrierName || order.carrierName || "Delhivery Surface";

  return generateShippingLabelPdf({
    orderNumber: order.orderNumber,
    storeName: store === "jewellery" ? "Fashion Cart — Imperial Fine Jewellery" : "Fashion Cart — Atelier Haute Couture",
    awbNumber: awb,
    carrierName: carrier,
    routingCode: order.shipment?.routingCode || `${addr.state.slice(0, 3).toUpperCase()}-01`,
    isCod,
    collectibleAmount: isCod ? Number(order.total) : 0,
    weightKg: Number(order.shipment?.packageWeightKg || 0.5),
    customer: addr,
    sender: {
      businessName: "Fashion Cart Logistics Hub",
      contactPerson: pickup.contactPerson,
      phone: pickup.phone,
      addressLine1: pickup.addressLine1,
      city: pickup.city,
      state: pickup.state,
      pinCode: pickup.pinCode,
    },
    items: order.items.map((it) => ({
      name: it.productNameSnapshot,
      sku: it.skuSnapshot,
      size: it.sizeSnapshot,
      colour: it.colourSnapshot,
      quantity: it.quantity,
    })),
  });
}
