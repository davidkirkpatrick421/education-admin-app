import mysql from 'mysql2';
import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

const api = express();
const PORT = process.env.API_PORT;

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
});

db.getConnection((err) => {
    if (err) return console.log(err.message);
    console.log("Database Connected: Success!");
});

api.listen(PORT, () => {
    console.log(`API is running on port ${PORT}`);
});
