import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

// PostgreSQL connection pool for the API data tier (Supabase in production).
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

pool.connect()
    .then((client) => {
        client.release();
        console.log('Connected to PostgreSQL');
    })
    .catch((err) => console.error('Database connection error:', err.message));

// Single query helper so models stay driver-agnostic: returns the result rows.
export async function query(sql, params = []) {
    const { rows } = await pool.query(sql, params);
    return rows;
}

export default pool;
