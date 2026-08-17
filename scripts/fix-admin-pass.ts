import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: { equals: "bablusoni2825@gmail.com", mode: "insensitive" } },
  });

  console.log("Current User in DB:", user);

  const hash = await bcrypt.hash("bablusoni2825", 12);

  if (user) {
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        email: "bablusoni2825@gmail.com",
        passwordHash: hash,
        role: "ADMIN",
        isActive: true,
      },
    });
    console.log("Updated Admin User:", updated);
  } else {
    const created = await prisma.user.create({
      data: {
        email: "bablusoni2825@gmail.com",
        name: "Bablu Soni",
        phone: "9771039201",
        passwordHash: hash,
        role: "ADMIN",
        isActive: true,
      },
    });
    console.log("Created Admin User:", created);
  }

  // Also verify bcrypt.compare
  const check = await bcrypt.compare("bablusoni2825", hash);
  console.log("Password verification test:", check ? "MATCHED ✅" : "FAILED ❌");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
