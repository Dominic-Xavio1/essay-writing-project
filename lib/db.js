import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

const pool = new Pool(
  connectionString
    ? {
        connectionString,
        ssl: {
          rejectUnauthorized: false,
        },
      }
    : {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: Number(process.env.DB_PORT) || 5432,
      }
);

export default pool;

let schemaInitialized = false;

export async function ensureSchema() {
  if (schemaInitialized) return;
  try {
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_superuser BOOLEAN DEFAULT FALSE;
      ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
      ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_status_check;
      ALTER TABLE posts ADD CONSTRAINT posts_status_check CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'published'));
      CREATE TABLE IF NOT EXISTS notifications (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title       VARCHAR(255) NOT NULL,
        message     TEXT NOT NULL,
        type        VARCHAR(50) DEFAULT 'info',
        link        TEXT DEFAULT '',
        is_read     BOOLEAN DEFAULT FALSE,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    schemaInitialized = true;
  } catch (err) {
    console.warn('Schema initialization warning:', err instanceof Error ? err.message : err);
  }
}

export async function query(text, params) {
  if (!schemaInitialized) {
    await ensureSchema();
  }
  const result = await pool.query(text, params);
  return result;
}


