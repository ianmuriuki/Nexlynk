// migrations/run.js
// Usage: node migrations/run.js
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const files = fs.readdirSync(__dirname)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    console.log(`Running migration: ${file}`);
    const sql = fs.readFileSync(path.join(__dirname, file), 'utf8');
    await pool.query(sql);
    console.log(`  ✓ ${file}`);
  }

  await pool.end();
  console.log('All migrations complete.');
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});