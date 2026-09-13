import "dotenv/config";
import { Pool } from "pg";

const globalForPool = global;
export const pool =
  globalForPool.pgPool ||
  new Pool(
    process.env.DATABASE_URL
      ? {
          connectionString: process.env.DATABASE_URL,
          max: 20,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 5000,
          ssl: { rejectUnauthorized: false },
        }
      : {
          user: process.env.DB_USER,
          host: process.env.DB_HOST,
          database: process.env.DB_NAME,
          password: process.env.DB_PASSWORD,
          port: Number(process.env.DB_PORT) || 5432,
        }
  );

if (process.env.NODE_ENV !== "production") {
  globalForPool.pgPool = pool;
}

export default pool;