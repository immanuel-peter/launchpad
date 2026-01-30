import postgres from "postgres";
import { readFileSync } from "fs";
import { join } from "path";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const client = postgres(connectionString, { max: 1 });

const migrations = [
  "drizzle/0000_init.sql",
  "drizzle/0001_remove_shortlisted.sql",
  "drizzle/0002_company_workflows.sql",
];

try {
  console.log("🚀 Starting migrations...\n");
  
  for (const migrationFile of migrations) {
    console.log(`📄 Running ${migrationFile}...`);
    const sql = readFileSync(join(process.cwd(), migrationFile), "utf-8");
    await client.unsafe(sql);
    console.log(`✅ ${migrationFile} completed\n`);
  }
  
  console.log("🎉 All migrations completed successfully!");
} catch (error) {
  console.error("❌ Migration failed:", error);
  process.exit(1);
} finally {
  await client.end();
}
