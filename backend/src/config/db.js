const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // required for Supabase
});

// Wrap pool.query to match mysql2's [rows] destructuring pattern
// mysql2 returns [rows, fields]; pg returns { rows }
// We expose a compatible .query() that returns [rows]
const db = {
  query: async (text, params) => {
    const result = await pool.query(text, params);
    return [result.rows, result.fields];
  },
  // expose pool for transactions if needed
  pool,
};

module.exports = db;
