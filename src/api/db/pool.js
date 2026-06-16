import mysql from 'mysql2';
import dotenv from 'dotenv';
dotenv.config();

// Connection pool for the API data tier.
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
});

pool.getConnection((err) => {
    if (err) return console.error('Error connecting to the database:', err.message);
});

// Single query helper so models stay driver-agnostic: returns the result rows.
// (Phase 2 swaps the pool/driver here without touching any model.)
export async function query(sql, params = []) {
    const [rows] = await pool.promise().query(sql, params);
    return rows;
}

export default pool;
