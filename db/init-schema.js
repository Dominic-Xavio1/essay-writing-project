import "dotenv/config";
import { Pool } from "pg";
import fs from "fs";
import path from "path";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
});

async function initializeSchema() {
  try {
    console.log("📋 Reading schema.sql...");
    const schemaPath = path.join(path.dirname(new URL(import.meta.url).pathname), "schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf8");

    console.log("🔧 Executing schema...");
    await pool.query(schema);

    console.log("✅ Schema initialization complete!");
  } catch (error) {
    console.error("❌ Error initializing schema:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initializeSchema();
