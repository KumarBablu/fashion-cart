/**
 * Creates (or promotes) an admin user for Fashion Cart.
 *
 * Usage:
 *   npm run create-admin
 *
 * This prompts interactively for name, email, and password so no admin
 * credentials are ever hard-coded into the source or committed to Git.
 */
import { createInterface } from "readline/promises";
import { stdin, stdout } from "process";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function main() {
  const rl = createInterface({ input: stdin, output: stdout });

  console.log("Fashion Cart — Create Admin Account\n");

  const name = (await rl.question("Admin full name: ")).trim();
  const email = (await rl.question("Admin email: ")).trim().toLowerCase();

  if (!isValidEmail(email)) {
    console.error("That doesn't look like a valid email address. Aborting.");
    rl.close();
    process.exit(1);
  }

  let password = "";
  while (password.length < 8) {
    password = await rl.question("Admin password (min 8 characters, input is not hidden): ");
    if (password.length < 8) console.log("Password must be at least 8 characters.\n");
  }

  rl.close();

  const passwordHash = await bcrypt.hash(password, 12);

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    if (existing.role === "ADMIN") {
      console.log(`\n${email} is already an admin.`);
    } else {
      await prisma.user.update({
        where: { email },
        data: { role: "ADMIN", passwordHash, isActive: true },
      });
      console.log(`\nExisting user ${email} has been promoted to ADMIN and had their password reset.`);
    }
  } else {
    await prisma.user.create({
      data: { name: name || "Admin", email, passwordHash, role: "ADMIN" },
    });
    console.log(`\nAdmin account created for ${email}.`);
  }

  console.log("You can now log in at /admin/login.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
