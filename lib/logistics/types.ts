/**
 * Unified Logistics & Courier Architecture Types
 * Supports Shiprocket, Delhivery, BlueDart, DTDC, Xpressbees, and Manual Carrier fallbacks.
 */

export type CourierCode =
  | "shiprocket"
  | "delhivery"
  | "bluedart"
  | "dtdc"
  | "xpressbees"
  | "shadowfax"
  | "ekart"
  | "manual";

export type ShipmentLifecycleStatus =
  | "DRAFT"
  | "AWB_ASSIGNED"
  | "PICKUP_SCHEDULED"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "FAILED_ATTEMPT"
  | "RTO_INITIATED"
  | "RTO_DELIVERED"
  | "CANCELLED";

export interface RateEstimateQuery {
  pickupPincode: string;
  deliveryPincode: string;
  weightKg: number;
  lengthCm?: number;
  breadthCm?: number;
  heightCm?: number;
  isCod: boolean;
  orderTotal: number;
}

export interface CourierRateOption {
  courierCode: string;
  courierName: string;
  courierCompanyId?: number | string;
  rate: number;
  estimatedDeliveryDays: number;
  estimatedDeliveryDate?: string;
  etd?: string;
  rating?: number;
  isRecommended?: boolean;
  isCodAvailable: boolean;
}

export interface CreateShipmentPayload {
  orderId: string;
  orderNumber: string;
  store: "garments" | "jewellery";
  pickupLocationId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  shippingAddress: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pinCode: string;
    landmark?: string;
  };
  items: Array<{
    name: string;
    sku: string;
    quantity: number;
    unitPrice: number;
  }>;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  isCod: boolean;
  packageWeightKg: number;
  lengthCm?: number;
  breadthCm?: number;
  heightCm?: number;
  preferredCourierId?: string | number;
}

export interface CreateShipmentResult {
  success: boolean;
  awbNumber: string;
  courierCode: string;
  courierName: string;
  shipmentIdExternal?: string;
  orderIdExternal?: string;
  routingCode?: string;
  labelUrl?: string;
  manifestUrl?: string;
  pickupToken?: string;
  pickupScheduledDate?: Date;
  shippingCost?: number;
  estimatedDelivery?: Date;
  error?: string;
  rawResponse?: any;
}

export interface TrackingCheckpoint {
  status: ShipmentLifecycleStatus;
  statusDescription: string;
  location?: string;
  timestamp: Date;
  rawPayload?: any;
}

export interface TrackingResult {
  awbNumber: string;
  currentStatus: ShipmentLifecycleStatus;
  statusDescription: string;
  carrierName: string;
  origin?: string;
  destination?: string;
  estimatedDelivery?: Date;
  deliveredAt?: Date;
  activities: TrackingCheckpoint[];
}

export interface ICourierProvider {
  readonly code: CourierCode;
  readonly name: string;

  checkServiceability(query: RateEstimateQuery): Promise<CourierRateOption[]>;
  createShipment(payload: CreateShipmentPayload): Promise<CreateShipmentResult>;
  generateLabel(awbOrShipmentId: string): Promise<{ labelPdfUrl?: string; base64Pdf?: string }>;
  schedulePickup(shipmentId: string, pickupDate?: string): Promise<{ success: boolean; token?: string; error?: string }>;
  trackShipment(awbNumber: string): Promise<TrackingResult>;
  cancelShipment(awbNumber: string): Promise<{ success: boolean; message?: string }>;
}
