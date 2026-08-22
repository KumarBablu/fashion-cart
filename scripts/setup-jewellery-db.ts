import { execSync } from "child_process";
import * as dotenv from "dotenv";

dotenv.config();

async function setup() {
  const jewelleryUrl = process.env.JEWELLERY_DATABASE_URL;
  const directUrl = process.env.JEWELLERY_DIRECT_URL || jewelleryUrl;

  if (!jewelleryUrl || jewelleryUrl.includes("[YOUR-PASSWORD]")) {
    console.error("❌ Error: JEWELLERY_DATABASE_URL is not configured properly in your .env file.");
    console.error("Please replace [YOUR-PASSWORD] with your actual Supabase database password in .env");
    process.exit(1);
  }

  console.log("🚀 Step 1: Pushing database schema to fashion-cart-jwellery Supabase DB...");
  try {
    execSync("npx prisma db push --skip-generate", {
      env: {
        ...process.env,
        DATABASE_URL: jewelleryUrl,
        DIRECT_URL: directUrl,
      },
      stdio: "inherit",
    });
    console.log("✅ Database schema pushed successfully!");
  } catch (err) {
    console.error("❌ Failed to push schema to jewellery database:", err);
    process.exit(1);
  }

  console.log("\n💎 Step 2: Seeding Jewellery Catalog (Categories, Jhumkas, Kundan Sets, Bangles)...");
  try {
    execSync("npx tsx scripts/seed-jewellery-catalog.ts", {
      env: {
        ...process.env,
      },
      stdio: "inherit",
    });
    console.log("✅ Jewellery catalog seeded successfully!");
  } catch (err) {
    console.error("❌ Failed to seed jewellery catalog:", err);
    process.exit(1);
  }

  console.log("\n🎉 All set! You can now start the store with: npm run dev");
}

setup();
