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

// API endpoint for user login form
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

// API endpoint to fetch all officers for admin dashboard

api.get('/officers', async (req, res) => {
    try {
        const [rows] = await db.promise().query(
            'SELECT id, email, first_name, surname, is_active, created_at FROM users WHERE role = ?',
            ['officer']
        );
        res.json({ officers: rows });
    } catch (error) {
        console.error('Error fetching officers:', error.message);
        res.status(500).json({ error: 'Error fetching officers' });
    }
});

// API endpoint to create a new officer

api.post('/officers', async (req, res) => {
        const { email, first_name, surname, password } = req.body;
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            await db.promise().query(
                'INSERT INTO users (email, first_name, surname, password, role) VALUES (?, ?, ?, ?, ?)',
                [email, first_name, surname, hashedPassword, 'officer']
            );
            res.status(201).json({ message: 'Officer created successfully' });
        } catch (error) {
            console.error('Error creating officer:', error.message);
            res.status(500).json({ error: 'Error creating officer' });
        }
});

// API endpoint to fetch officer details by id for editing

api.get('/officers/:id', async (req, res) => {
    const officerId = req.params.id;
    try {
        const [rows] = await db.promise().query(
            'SELECT id, email, first_name, surname, is_active FROM users WHERE id = ? AND role = ?',
            [officerId, 'officer']
        );
    
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Officer not found' });
        }
        res.json({ officer: rows[0] });
    } catch (error) {
        console.error('Error fetching officer details:', error.message);
        res.status(500).json({ error: 'Error fetching officer details' });
    }
});

// API endpoint to update officer details

api.post('/officers/:id/edit', async (req, res) => {
    const { email, first_name, surname } = req.body;
    const officerId = req.params.id;
    
    try {
        await db.promise().query(
            'UPDATE users SET email = ?, first_name = ?, surname = ? WHERE id = ? AND role = ?',
            [email, first_name, surname, officerId, 'officer']
        );
        res.json({ message: 'Officer updated successfully' });
    } catch (error) {
        console.error('Error updating officer:', error.message);
        res.status(500).json({ error: 'Error updating officer' });
    }
});

// API endpoint to deactivate an officer

api.post('/officers/:id/deactivate', async (req, res) => {
    const officerId = req.params.id;
    try {
        await db.promise().query(
            'UPDATE users SET is_active = 0 WHERE id = ? AND role = ?',
            [officerId, 'officer']
        );
        res.json({ message: 'Officer deactivated successfully' });
    } catch (error) {
        console.error('Error deactivating officer:', error.message);
        res.status(500).json({ error: 'Error deactivating officer' });
    }
});

// API endpoint to reactivate an officer

api.post('/officers/:id/reactivate', async (req, res) => {
    const officerId = req.params.id;
    try {
        await db.promise().query(
            'UPDATE users SET is_active = 1 WHERE id = ? AND role = ?',
            [officerId, 'officer']
        );
        res.json({ message: 'Officer reactivated successfully' });
    } catch (error) {
        console.error('Error reactivating officer:', error.message);
        res.status(500).json({ error: 'Error reactivating officer' });
    }
});


api.listen(PORT, () => {
    console.log(`API is running on port ${PORT}`);
});
