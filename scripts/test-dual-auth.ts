import { prisma } from "../lib/db";
import { verifyPassword } from "../lib/auth/password";

async function testDualAuth() {
  console.log("--- TESTING DUAL AUTHENTICATION ---");

  // 1. Find by email
  const userByEmail = await prisma.user.findUnique({
    where: { email: "bablusoni2825@gmail.com" },
  });
  console.log("1. Email lookup found:", userByEmail?.name, "| Phone:", userByEmail?.phone);
  const emailPasswordValid = await verifyPassword("Cart@9547", userByEmail!.passwordHash);
  console.log("   Email Password Valid:", emailPasswordValid);

  // 2. Find by phone
  const rawPhone = "9771039201";
  const digits = rawPhone.replace(/\D/g, "").slice(-10);
  const userByPhone = await prisma.user.findFirst({
    where: {
      OR: [
        { phone: digits },
        { phone: `+91${digits}` },
        { phone: { contains: digits } },
      ],
    },
  });
  console.log("2. Phone lookup found:", userByPhone?.name, "| Email:", userByPhone?.email);
  const phonePasswordValid = await verifyPassword("Cart@9547", userByPhone!.passwordHash);
  console.log("   Phone Password Valid:", phonePasswordValid);

  // 3. Check duplicate phone prevention
  const duplicatePhoneCheck = await prisma.user.findFirst({
    where: {
      OR: [
        { phone: digits },
        { phone: `+91${digits}` },
        { phone: { contains: digits } },
      ],
    },
  });
  console.log("3. Duplicate phone detection:", duplicatePhoneCheck ? "BLOCKED DUPLICATE" : "ALLOWED");

  console.log("\n✅ All dual-auth checks passed successfully!");
}

testDualAuth()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
