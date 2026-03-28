import mysql from 'mysql2';
import express from 'express';
const server = express();
const PORT = 5000;

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',            // 'root' MAMP password    
    database: 'web_dev',     //  name of your database
    port: '8889'             //  8889 MAMP        
});

db.getConnection((err) => {
    if (err) return console.log(err.message);
    console.log("connected successfully");
});

server.listen(PORT, () => {
    console.log(`API is running on port ${PORT}`);
});