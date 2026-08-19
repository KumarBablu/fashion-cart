import { prisma } from "../lib/db";

async function main() {
  console.log("Updating active database business and email settings...");

  const existingBusiness = await prisma.businessSettings.findFirst();
  if (existingBusiness) {
    await prisma.businessSettings.update({
      where: { id: existingBusiness.id },
      data: {
        businessName: "Fashion Cart Premium Outlet",
        businessAddress: "Sonar Toli, City: Siwan, State: Bihar, PIN: 841226",
        phone: "+91 97710 39201",
        email: "Fashioncart.support@gmail.com",
        gstin: "10AABCU9603R1ZM",
      },
    });
  } else {
    await prisma.businessSettings.create({
      data: {
        businessName: "Fashion Cart Premium Outlet",
        businessAddress: "Sonar Toli, City: Siwan, State: Bihar, PIN: 841226",
        phone: "+91 97710 39201",
        email: "Fashioncart.support@gmail.com",
        gstin: "10AABCU9603R1ZM",
      },
    });
  }

  const existingEmail = await prisma.emailSettings.findFirst();
  if (existingEmail) {
    await prisma.emailSettings.update({
      where: { id: existingEmail.id },
      data: {
        fromEmail: "Fashioncart.support@gmail.com",
        fromName: "Fashion Cart Premium Outlet",
        smtpUser: "Fashioncart.support@gmail.com",
      },
    });
  }

  console.log("Database business and email settings updated successfully to Siwan, Bihar & Fashioncart.support@gmail.com!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
