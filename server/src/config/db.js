// src/config/db.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  family: 4,
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err);
});

/**
 * Execute a parameterized query.
 * @param {string} text  - SQL string
 * @param {any[]}  params - bound parameters
 */
const query = (text, params) => pool.query(text, params);

/**
 * Check the connection on startup.
 */
const testConnection = async () => {
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
    console.log('✓ PostgreSQL connected');
  } finally {
    client.release();
  }
};

module.exports = { query, pool, testConnection };