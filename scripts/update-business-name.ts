import { prisma } from "../lib/db";

async function inspectAndUpdateBusinessSettings() {
  console.log("=== INSPECTING BUSINESS SETTINGS ===");
  const business = await prisma.businessSettings.findFirst();
  console.log("Current business settings:", business);

  const updated = await prisma.businessSettings.upsert({
    where: { id: business?.id || "default-business-id" },
    create: {
      businessName: "Fashion Cart",
      businessAddress: "Atelier Logistics Hub, 108 Fashion Avenue, Indiranagar, Bengaluru, Karnataka - 560038",
      phone: "+91 97710 39201",
      email: "support@fashioncart.shop",
      gstin: "29AABCU9603R1ZM",
    },
    update: {
      businessName: "Fashion Cart",
      businessAddress: "Atelier Logistics Hub, 108 Fashion Avenue, Indiranagar, Bengaluru, Karnataka - 560038",
      phone: "+91 97710 39201",
      email: "support@fashioncart.shop",
      gstin: "29AABCU9603R1ZM",
    },
  });

  console.log("✅ Updated business settings:", updated);
}

inspectAndUpdateBusinessSettings()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
