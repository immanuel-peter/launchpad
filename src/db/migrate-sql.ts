import postgres from "postgres";
import { readFileSync } from "fs";
import { join } from "path";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const client = postgres(connectionString, { max: 1 });

try {
  const sql = readFileSync(join(process.cwd(), "drizzle/0000_init.sql"), "utf-8");
  await client.unsafe(sql);
  console.log("✅ Migration completed successfully");
} catch (error) {
  console.error("❌ Migration failed:", error);
  process.exit(1);
} finally {
  await client.end();
}
