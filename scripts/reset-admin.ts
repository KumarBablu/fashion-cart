import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2] || "bablusoni2825@gmail.com";
  const newPassword = process.argv[3] || "admin12345";

  console.log(`\n========================================`);
  console.log(`Fashion Cart — Admin Password Reset Tool`);
  console.log(`========================================\n`);

  const passwordHash = await bcrypt.hash(newPassword, 12);

  const updated = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: "ADMIN",
      isActive: true,
    },
    create: {
      name: "Admin",
      email,
      passwordHash,
      role: "ADMIN",
      isActive: true,
    },
  });

  console.log(`✅ SUCCESS: Admin password for ${updated.email} has been updated!`);
  console.log(`📧 Email:    ${updated.email}`);
  console.log(`🔑 Password: ${newPassword}`);
  console.log(`🌐 Login at: http://localhost:3000/admin/login\n`);
}

main()
  .catch((e) => {
    console.error("Error resetting admin password:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
