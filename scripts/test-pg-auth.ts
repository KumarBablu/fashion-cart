import pg from "pg";
import * as dotenv from "dotenv";

dotenv.config();

async function testPgAuth() {
  const { Client } = pg;
  const connectionString = process.env.JEWELLERY_DATABASE_URL;

  console.log("Connecting with pg client to:", connectionString?.replace(/:([^:@]+)@/, ":****@"));

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  });

  try {
    await client.connect();
    console.log("🎉 PostgreSQL Authentication SUCCESS!");
    const res = await client.query("SELECT current_user, current_database(), now();");
    console.log("Query Result:", res.rows);
    await client.end();
  } catch (err: any) {
    console.error("❌ PG Handshake Failed:");
    console.error("Code:", err.code);
    console.error("Message:", err.message);
    console.error("Detail:", err.detail);
  }
}

testPgAuth();
