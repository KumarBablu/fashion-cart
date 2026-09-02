import {
  ICourierProvider,
  CourierRateOption,
  CreateShipmentPayload,
  CreateShipmentResult,
  RateEstimateQuery,
  TrackingResult,
} from "./types";

export class ManualAdapter implements ICourierProvider {
  readonly code = "manual";
  readonly name = "Manual / Local Delivery Partner";

  async checkServiceability(_query: RateEstimateQuery): Promise<CourierRateOption[]> {
    return [
      {
        courierCode: "manual_custom",
        courierName: "Direct Local Courier / In-house Dispatch",
        rate: 0,
        estimatedDeliveryDays: 2,
        rating: 5.0,
        isRecommended: true,
        isCodAvailable: true,
      },
    ];
  }

  async createShipment(payload: CreateShipmentPayload): Promise<CreateShipmentResult> {
    const customAwb = `MNL-${Date.now().toString().slice(-8)}`;
    return {
      success: true,
      awbNumber: customAwb,
      courierCode: "manual",
      courierName: "Local Carrier / Direct Handover",
      orderIdExternal: payload.orderNumber,
      routingCode: "LOCAL-DIRECT",
      shippingCost: 0,
      estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    };
  }

  async generateLabel(_awbOrShipmentId: string): Promise<{ labelPdfUrl?: string; base64Pdf?: string }> {
    return {};
  }

  async schedulePickup(_shipmentId: string): Promise<{ success: boolean; token?: string }> {
    return { success: true, token: `LOCAL-PICKUP-${Date.now()}` };
  }

  async trackShipment(awbNumber: string): Promise<TrackingResult> {
    return {
      awbNumber,
      currentStatus: "SHIPPED" as any,
      statusDescription: "Package dispatched with local delivery executive",
      carrierName: "Local Carrier",
      activities: [
        {
          status: "SHIPPED" as any,
          statusDescription: "Handed over to delivery executive",
          timestamp: new Date(),
        },
      ],
    };
  }

  async cancelShipment(_awbNumber: string): Promise<{ success: boolean; message?: string }> {
    return { success: true, message: "Manual delivery cancelled" };
  }
}
