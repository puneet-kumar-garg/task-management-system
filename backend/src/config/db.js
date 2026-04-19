const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

const db = {
  query: async (text, params) => {
    const result = await pool.query(text, params);
    return [result.rows, result.fields];
  },
  pool,
};

module.exports = db;
