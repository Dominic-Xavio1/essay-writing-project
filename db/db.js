import "dotenv/config";
import { Pool } from "pg";

console.log(process.env.DATABASE_URL);

const globalForPool = global;
console.log(globalForPool.pgPool);
export const pool = globalForPool.pgPool || new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    ssl: false
});
console.log(pool);
pool.connect((err, client, release) => {
  if (err) {
    console.error("❌ Database connection failed:", err.message);
  } else {
    console.log("✅ Database connection established successfully!");
    release();
  }
});

export default pool;