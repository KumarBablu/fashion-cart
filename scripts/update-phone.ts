import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Update admin user phone number
  await prisma.user.updateMany({
    where: { email: "bablusoni2825@gmail.com" },
    data: { phone: "9771039201" },
  });

  // Update or upsert BusinessSettings
  const existing = await prisma.businessSettings.findFirst();
  if (existing) {
    await prisma.businessSettings.update({
      where: { id: existing.id },
      data: { phone: "9771039201", email: "bablusoni2825@gmail.com" },
    });
  } else {
    await prisma.businessSettings.create({
      data: {
        businessName: "Fashion Cart Haute Couture",
        businessAddress: "Bengaluru, Karnataka, India",
        phone: "9771039201",
        email: "bablusoni2825@gmail.com",
      },
    });
  }

  console.log("Updated official boutique phone number to 9771039201 in database!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
