import { describe, it, expect } from "vitest";
import { ShiprocketAdapter } from "@/lib/logistics/shiprocket-adapter";
import { ManualAdapter } from "@/lib/logistics/manual-adapter";
import { generateShippingLabelPdf } from "@/lib/logistics/label-generator";
import { calculateOrderWeight } from "@/lib/logistics/service";

describe("Logistics Architecture & Provider Adapters", () => {
  describe("ShiprocketAdapter", () => {
    const adapter = new ShiprocketAdapter({ isSandbox: true });

    it("evaluates courier serviceability and returns rate options", async () => {
      const rates = await adapter.checkServiceability({
        pickupPincode: "395002",
        deliveryPincode: "110001",
        weightKg: 0.6,
        isCod: false,
        orderTotal: 1499,
      });

      expect(rates.length).toBeGreaterThan(0);
      const topRate = rates[0];
      expect(topRate.rate).toBeGreaterThan(0);
      expect(topRate.estimatedDeliveryDays).toBeGreaterThan(0);
      expect(topRate.isRecommended).toBe(true);
    });

    it("creates a shipment with AWB and routing in sandbox mode", async () => {
      const result = await adapter.createShipment({
        orderId: "ord_test_123",
        orderNumber: "FC-1099",
        store: "garments",
        customerName: "Rahul Sharma",
        customerPhone: "9876543210",
        customerEmail: "rahul@example.com",
        shippingAddress: {
          addressLine1: "Flat 402, Lotus Apartments",
          city: "New Delhi",
          state: "Delhi",
          pinCode: "110001",
        },
        items: [
          {
            name: "Banarasi Silk Saree",
            sku: "SAR-BAN-01",
            quantity: 1,
            unitPrice: 2999,
          },
        ],
        subtotal: 2999,
        discount: 0,
        tax: 0,
        total: 2999,
        isCod: false,
        packageWeightKg: 0.6,
      });

      expect(result.success).toBe(true);
      expect(result.awbNumber).toBeTruthy();
      expect(result.courierName).toBe("Delhivery Surface");
      expect(result.routingCode).toContain("DEL");
    });
  });

  describe("ManualAdapter", () => {
    const manual = new ManualAdapter();

    it("supports custom manual dispatch fallback", async () => {
      const result = await manual.createShipment({
        orderId: "ord_manual_1",
        orderNumber: "FC-MNL-1",
        store: "jewellery",
        customerName: "Priya Patel",
        customerPhone: "9811122233",
        customerEmail: "priya@example.com",
        shippingAddress: {
          addressLine1: "12 Marine Drive",
          city: "Mumbai",
          state: "Maharashtra",
          pinCode: "400020",
        },
        items: [
          {
            name: "Kundan Gold Choker",
            sku: "JW-KUN-01",
            quantity: 1,
            unitPrice: 4999,
          },
        ],
        subtotal: 4999,
        discount: 0,
        tax: 0,
        total: 4999,
        isCod: true,
        packageWeightKg: 0.15,
      });

      expect(result.success).toBe(true);
      expect(result.awbNumber).toMatch(/^MNL-/);
    });
  });

  describe("4x6 Thermal Shipping Label Generator", () => {
    it("generates a valid PDF buffer for prepaid orders", async () => {
      const pdfBuffer = await generateShippingLabelPdf({
        orderNumber: "FC-1044",
        storeName: "Fashion Cart — Atelier Haute Couture",
        awbNumber: "DLHV8829104",
        carrierName: "Delhivery Surface",
        routingCode: "DEL-HUB-01",
        isCod: false,
        collectibleAmount: 0,
        weightKg: 0.6,
        customer: {
          fullName: "Ananya Roy",
          mobileNumber: "9876543210",
          addressLine1: "Park Street 4B",
          city: "Kolkata",
          state: "West Bengal",
          pinCode: "700016",
        },
        sender: {
          businessName: "Fashion Cart Logistics",
          phone: "9876543210",
          addressLine1: "Ring Road Hub",
          city: "Surat",
          state: "Gujarat",
          pinCode: "395002",
        },
        items: [
          {
            name: "Pure Georgette Anarkali Suit",
            sku: "ANR-GEO-01",
            size: "M",
            colour: "Emerald Green",
            quantity: 1,
          },
        ],
      });

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(500);
      // Valid PDF magic header %PDF-
      expect(pdfBuffer.toString("utf8", 0, 5)).toBe("%PDF-");
    });

    it("generates a valid PDF buffer for COD orders with collectible amount", async () => {
      const pdfBuffer = await generateShippingLabelPdf({
        orderNumber: "FC-1045",
        storeName: "Fashion Cart — Imperial Fine Jewellery",
        awbNumber: "BD9928174",
        carrierName: "BlueDart Priority Air",
        routingCode: "MUM-VAULT-01",
        isCod: true,
        collectibleAmount: 3499,
        weightKg: 0.15,
        customer: {
          fullName: "Sunita Verma",
          mobileNumber: "9123456789",
          addressLine1: "Bandra West",
          city: "Mumbai",
          state: "Maharashtra",
          pinCode: "400050",
        },
        sender: {
          businessName: "Fashion Cart Jewellery Vault",
          phone: "9876543210",
          addressLine1: "Diamond District Hub",
          city: "Surat",
          state: "Gujarat",
          pinCode: "395002",
        },
        items: [
          {
            name: "Royal Jadau Polki Necklace",
            sku: "JW-JAD-01",
            quantity: 1,
          },
        ],
      });

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.toString("utf8", 0, 5)).toBe("%PDF-");
    });
  });

  describe("Weight Estimation Calculation", () => {
    it("estimates weight for garments vs jewellery correctly", async () => {
      const garmentWeight = await calculateOrderWeight([{ quantity: 2 }], "garments");
      const jewelWeight = await calculateOrderWeight([{ quantity: 2 }], "jewellery");

      expect(garmentWeight).toBeGreaterThan(jewelWeight);
      expect(garmentWeight).toBeCloseTo(1.2, 1);
      expect(jewelWeight).toBeCloseTo(0.4, 1);
    });
  });
});
