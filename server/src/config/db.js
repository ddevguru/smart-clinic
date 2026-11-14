const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:5432/smart_clinic_os';

const isProduction = process.env.NODE_ENV === 'production' || !!process.env.RENDER;
const isLocal = connectionString.includes('127.0.0.1') || connectionString.includes('localhost');

const pool = new Pool({
  connectionString,
  ssl: (!isLocal && (isProduction || process.env.DB_SSL === 'true')) ? { rejectUnauthorized: false } : false,
  max: parseInt(process.env.DB_POOL_MAX || '25', 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  statement_timeout: 10000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
  withTransaction: async (callback) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
};

