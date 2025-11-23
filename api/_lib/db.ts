import { Pool } from 'pg';

// Create a connection pool with pooling enabled for Vercel serverless
let pool: Pool | null = null;

export const getPool = (): Pool => {
  if (!pool) {
    // Parse DATABASE_URL or construct from individual env vars
    const connectionString = process.env.DATABASE_URL ||
      `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT || '5432'}/${process.env.DB_NAME}`;

    pool = new Pool({
      connectionString,
      // Optimized for serverless
      max: 1, // Limit connection pool size for serverless
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 5000,
      ssl: process.env.DB_SSL !== 'false' ? {
        rejectUnauthorized: false
      } : undefined
    });

    pool.on('error', (err) => {
      console.error('Unexpected database pool error:', err);
    });
  }

  return pool;
};

export const query = async (text: string, params?: any[]): Promise<any> => {
  const pool = getPool();
  const start = Date.now();

  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};
