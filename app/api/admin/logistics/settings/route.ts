import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth/session";

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [settings, pickupLocations] = await Promise.all([
    prisma.logisticsSettings.findFirst(),
    prisma.pickupLocation.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  return NextResponse.json({
    settings: settings || {
      provider: "shiprocket",
      environment: "sandbox",
      autoFulfillEnabled: false,
      defaultGarmentWeight: 0.6,
      defaultJewelWeight: 0.15,
    },
    pickupLocations,
  });
}

export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const {
    provider,
    apiEmail,
    apiPassword,
    environment,
    autoFulfillEnabled,
    defaultGarmentWeight,
    defaultJewelWeight,
    pickupLocation,
  } = body;

  const existingSettings = await prisma.logisticsSettings.findFirst();

  const updatedSettings = existingSettings
    ? await prisma.logisticsSettings.update({
        where: { id: existingSettings.id },
        data: {
          provider: provider || existingSettings.provider,
          apiEmail: apiEmail !== undefined ? apiEmail : existingSettings.apiEmail,
          apiPassword: apiPassword !== undefined ? apiPassword : existingSettings.apiPassword,
          environment: environment || existingSettings.environment,
          autoFulfillEnabled: autoFulfillEnabled !== undefined ? autoFulfillEnabled : existingSettings.autoFulfillEnabled,
          defaultGarmentWeight: defaultGarmentWeight ? Number(defaultGarmentWeight) : existingSettings.defaultGarmentWeight,
          defaultJewelWeight: defaultJewelWeight ? Number(defaultJewelWeight) : existingSettings.defaultJewelWeight,
        },
      })
    : await prisma.logisticsSettings.create({
        data: {
          provider: provider || "shiprocket",
          apiEmail,
          apiPassword,
          environment: environment || "sandbox",
          autoFulfillEnabled: Boolean(autoFulfillEnabled),
          defaultGarmentWeight: Number(defaultGarmentWeight || 0.6),
          defaultJewelWeight: Number(defaultJewelWeight || 0.15),
        },
      });

  // If pickup location details provided, upsert default location
  if (pickupLocation && pickupLocation.addressLine1) {
    const existingPickup = await prisma.pickupLocation.findFirst({ where: { isDefault: true } });
    if (existingPickup) {
      await prisma.pickupLocation.update({
        where: { id: existingPickup.id },
        data: {
          nickname: pickupLocation.nickname || existingPickup.nickname,
          contactPerson: pickupLocation.contactPerson || existingPickup.contactPerson,
          phone: pickupLocation.phone || existingPickup.phone,
          addressLine1: pickupLocation.addressLine1 || existingPickup.addressLine1,
          city: pickupLocation.city || existingPickup.city,
          state: pickupLocation.state || existingPickup.state,
          pinCode: pickupLocation.pinCode || existingPickup.pinCode,
        },
      });
    } else {
      await prisma.pickupLocation.create({
        data: {
          locationCode: `HUB-MAIN-01`,
          store: "all",
          nickname: pickupLocation.nickname || "Primary Logistics Hub",
          contactPerson: pickupLocation.contactPerson || "Logistics Manager",
          phone: pickupLocation.phone || "9876543210",
          addressLine1: pickupLocation.addressLine1,
          city: pickupLocation.city,
          state: pickupLocation.state,
          pinCode: pickupLocation.pinCode,
          isDefault: true,
        },
      });
    }
  }

  return NextResponse.json({ success: true, settings: updatedSettings });
}
