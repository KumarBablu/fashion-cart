import { prisma } from "../lib/db";

async function main() {
  console.log("Updating official communication and business email to fashioncart.support@gmail.com...");

  // 1. Update or Create EmailSettings
  const existingEmailSettings = await prisma.emailSettings.findFirst();
  if (existingEmailSettings) {
    await prisma.emailSettings.update({
      where: { id: existingEmailSettings.id },
      data: {
        fromEmail: "fashioncart.support@gmail.com",
        notifyAdminEmail: "fashioncart.support@gmail.com",
        fromName: "Fashion Cart Boutique",
      },
    });
  } else {
    await prisma.emailSettings.create({
      data: {
        fromEmail: "fashioncart.support@gmail.com",
        notifyAdminEmail: "fashioncart.support@gmail.com",
        fromName: "Fashion Cart Boutique",
        smtpHost: "smtp.gmail.com",
        smtpPort: 465,
        smtpSecure: true,
      },
    });
  }

  // 2. Update or Create BusinessSettings
  const existingBusiness = await prisma.businessSettings.findFirst();
  if (existingBusiness) {
    await prisma.businessSettings.update({
      where: { id: existingBusiness.id },
      data: {
        email: "fashioncart.support@gmail.com",
      },
    });
  } else {
    await prisma.businessSettings.create({
      data: {
        businessName: "Fashion Cart",
        businessAddress: "108 Fashion Avenue, 100 Feet Road, Indiranagar, Bengaluru - 560038",
        phone: "+91 9771039201",
        email: "fashioncart.support@gmail.com",
        gstin: "29AAAAA0000A1Z5",
      },
    });
  }

  console.log("✅ Successfully updated company communication email to fashioncart.support@gmail.com across all database tables!");
}

main()
  .catch((e) => {
    console.error("Error updating company email:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
