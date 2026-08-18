import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const newPassword = "Cart@9547";
  const passwordHash = await bcrypt.hash(newPassword, 12);

  console.log("Searching for admin users...");

  // Find all users with ADMIN role or relevant admin emails
  const admins = await prisma.user.findMany({
    where: {
      OR: [
        { role: "ADMIN" },
        { email: { in: ["bablusoni2825@gmail.com", "admin@fashioncart.shop", "admin@fashion-cart.shop", "admin@example.com"] } },
      ],
    },
  });

  console.log(`Found ${admins.length} admin accounts in database:`);
  for (const a of admins) {
    console.log(` - ID: ${a.id} | Email: ${a.email} | Name: ${a.name} | Role: ${a.role} | Active: ${a.isActive}`);
  }

  // Update all of them to Cart@9547 and ensure ADMIN role + active
  for (const a of admins) {
    await prisma.user.update({
      where: { id: a.id },
      data: {
        passwordHash,
        role: "ADMIN",
        isActive: true,
      },
    });
    console.log(`✅ Updated password for ${a.email} to '${newPassword}' and confirmed ADMIN role.`);
  }

  // Also ensure standard admin accounts exist if not already present
  const defaultAdminEmails = ["bablusoni2825@gmail.com", "admin@fashioncart.shop"];
  for (const email of defaultAdminEmails) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (!existing) {
      const created = await prisma.user.create({
        data: {
          email,
          name: email === "bablusoni2825@gmail.com" ? "Bablu Soni (Admin)" : "System Administrator",
          passwordHash,
          role: "ADMIN",
          isActive: true,
        },
      });
      console.log(`✨ Created new ADMIN account: ${created.email} with password '${newPassword}'`);
    }
  }

  console.log("\n🎉 Admin password reset complete!");
}

main()
  .catch((e) => {
    console.error("Error resetting admin password:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
