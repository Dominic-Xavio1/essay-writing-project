import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT) || 5432,
});

export default pool;

export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
) {
  const result = await pool.query(text, params);
  return result as { rows: T[]; rowCount: number | null };
}
