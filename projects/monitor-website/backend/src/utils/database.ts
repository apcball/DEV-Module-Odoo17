import { Pool, QueryResult } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'monitor_website',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  // Connection pool settings
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Event listeners for connection monitoring
pool.on('connect', () => {
  console.log('📦 Database connected successfully');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
});

// Query helper function
export async function query(text: string, params?: any[]): Promise<QueryResult> {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('📊 Query executed:', { text: text.substring(0, 50), duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('❌ Database query error:', error);
    throw error;
  }
}

// Get client for transactions
export async function getClient() {
  return await pool.connect();
}

// Transaction helper
export async function withTransaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export default pool;