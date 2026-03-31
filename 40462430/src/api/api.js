import mysql from 'mysql2';
import express from 'express';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
dotenv.config();

const api = express();
api.use(express.json());
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

api.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const loginQuery = 'SELECT * FROM users WHERE email = ? AND is_active = 1';

    const [rows] = await db.promise().query(loginQuery, [email]);

    if (rows.length === 0) {
        return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
        return res.status(401).json({ error: 'Invalid password' });
    }

    res.json({
        message: 'Login successful',
        user: {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            surname: user.surname,
            role: user.role
        }
    });
});

api.listen(PORT, () => {
    console.log(`API is running on port ${PORT}`);
});
