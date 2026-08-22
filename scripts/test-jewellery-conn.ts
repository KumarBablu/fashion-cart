import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config();

async function testConnection() {
  const url6543 = process.env.JEWELLERY_DATABASE_URL;
  const url5432 = process.env.JEWELLERY_DIRECT_URL;

  console.log("Testing 6543 (Transaction Pooler)...");
  const client6543 = new PrismaClient({
    datasources: { db: { url: url6543 } },
  });

  try {
    const res = await client6543.$queryRawUnsafe("SELECT 1 as res;");
    console.log("✅ 6543 Connection SUCCESS:", res);
  } catch (err: any) {
    console.error("❌ 6543 Connection FAILED:", err.message);
  } finally {
    await client6543.$disconnect();
  }

  console.log("\nTesting 5432 (Session Mode / Direct)...");
  const client5432 = new PrismaClient({
    datasources: { db: { url: url5432 } },
  });

  try {
    const res = await client5432.$queryRawUnsafe("SELECT 1 as res;");
    console.log("✅ 5432 Connection SUCCESS:", res);
  } catch (err: any) {
    console.error("❌ 5432 Connection FAILED:", err.message);
  } finally {
    await client5432.$disconnect();
  }

  console.log("\nTesting Direct host (db.suxauikwunbthcydbkbl.supabase.co:5432)...");
  const directUrl = "postgresql://postgres:FashionCart%402025@db.suxauikwunbthcydbkbl.supabase.co:5432/postgres";
  const clientDirect = new PrismaClient({
    datasources: { db: { url: directUrl } },
  });

  try {
    const res = await clientDirect.$queryRawUnsafe("SELECT 1 as res;");
    console.log("✅ Direct host Connection SUCCESS:", res);
  } catch (err: any) {
    console.error("❌ Direct host Connection FAILED:", err.message);
  } finally {
    await clientDirect.$disconnect();
  }
}

testConnection();
