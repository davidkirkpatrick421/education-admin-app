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

    const loginQuery = `SELECT * FROM users WHERE email = ? AND is_active = 1`;

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
            `SELECT id, email, first_name, surname, is_active, created_at 
            FROM users WHERE role = ?`,
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
            `INSERT INTO users (email, first_name, surname, password, role) 
            VALUES (?, ?, ?, ?, ?)`,
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
            `SELECT id, email, first_name, surname, is_active 
            FROM users WHERE id = ? AND role = ?`,
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
            `UPDATE users SET email = ?, 
            first_name = ?, surname = ? 
            WHERE id = ? AND role = ?`,
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
            `UPDATE users SET is_active = 0 WHERE id = ? AND role = ?`,
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
            `UPDATE users SET is_active = 1 WHERE id = ? AND role = ?`,
            [officerId, 'officer']
        );
        res.json({ message: 'Officer reactivated successfully' });
    } catch (error) {
        console.error('Error reactivating officer:', error.message);
        res.status(500).json({ error: 'Error reactivating officer' });
    }
});

// API endpoint to show all programmes
api.get('/programmes', async (req, res) => {
    try {
        const [rows] = await db.promise().query(
            `SELECT * FROM programmes`
        );
        res.json({ programmes: rows });
    } catch (error) {
        console.error('Error fetching programmes:', error.message);
        res.status(500).json({ error: 'Error fetching programmes' });
    }
});

// API endpoint to show programme details by id
api.get('/programmes/:id', async (req, res) => {
    const programmeId = req.params.id;
    try {
        const [rows] = await db.promise().query(
            `SELECT * FROM programmes WHERE id = ?`,
            [programmeId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Programme not found' });
        }
        res.json({ programme: rows[0] });
    } catch (error) {
        console.error('Error fetching programme details:', error.message);
        res.status(500).json({ error: 'Error fetching programme details' });
    }
});

// API endpoint to create a new programme
api.post('/programmes', async (req, res) => {
    const { code, title, y2_weight, y3_weight, resit_cap_enabled, resit_cap_mark, board_deadline } = req.body;
    try {
        await db.promise().query(
            `INSERT INTO programmes (
            code, title, y2_weight, y3_weight, resit_cap_enabled, resit_cap_mark, board_deadline) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [code, title, y2_weight, y3_weight, resit_cap_enabled, resit_cap_mark, board_deadline]
        );
        res.status(201).json({ message: 'Programme created successfully' });
    } catch (error) {
        console.error('Error creating programme:', error.message);
        res.status(500).json({ error: 'Error creating programme' });
    }
});

// API endpoint to update programme details
api.post('/programmes/:id/edit', async (req, res) => {
    const { code, title, y2_weight, y3_weight, resit_cap_enabled, resit_cap_mark, board_deadline } = req.body;
    const programmeId = req.params.id;

    try {
        await db.promise().query(
            `UPDATE programmes SET code = ?, 
            title = ?, y2_weight = ?, 
            y3_weight = ?, resit_cap_enabled = ?, 
            resit_cap_mark = ?, 
            board_deadline = ? 
            WHERE id = ?`,
            [code, title, y2_weight, y3_weight, resit_cap_enabled, resit_cap_mark, board_deadline, programmeId]
        );
        res.json({ message: 'Programme updated successfully' });
    } catch (error) {
        console.error('Error updating programme:', error.message);
        res.status(500).json({ error: 'Error updating programme' });
    }
});

// API endpoint to show all assignments for admin dashboard with officer and programme details
api.get('/assignments', async (req, res) => {
    try {
        const [rows] = await db.promise().query(
            `SELECT officer_assignments.id, officer_assignments.is_active, 
            officer_assignments.assigned_at, users.id as officer_id, 
            users.first_name, users.surname, users.email, 
            programmes.id as programme_id, programmes.title as programme_title, 
            programmes.code 
            FROM officer_assignments 
            INNER JOIN users ON officer_assignments.officer_id = users.id 
            INNER JOIN programmes ON officer_assignments.programme_id = programmes.id 
            WHERE officer_assignments.is_active = 1 
            ORDER BY programmes.title, users.surname`
        );

        res.json({ assignments: rows });
    } catch (error) {
        console.error('Error fetching assignments:', error.message);
        res.status(500).json({ error: 'Error fetching assignments' });
    }
});

// API endpoint to get all officer and programme details for assignment form
api.get('/assignments/form-data', async (req, res) => {
    try {
        const [officers] = await db.promise().query(
            `SELECT id, first_name, surname FROM users 
            WHERE role = ? AND is_active = 1`,
            ['officer']
        );

        const [programmes] = await db.promise().query(
            `SELECT id, title FROM programmes`
        );

        res.json({ officers, programmes });
    } catch (error) {
        console.error('Error fetching form data:', error.message);
        res.status(500).json({ error: 'Error fetching form data' });
    }
});

// API endpoint to add a new assignment
// Validation to prevent duplicate active assignments for the same officer and programme 
// and bug fix added for inactive assignments from unique constraint on active assignments only
api.post('/assignments', async (req, res) => {
    const { officer_id, programme_id, assigned_by } = req.body;
    try {

        const [existing] = await db.promise().query(
            `SELECT id FROM officer_assignments 
            WHERE officer_id = ? 
            AND programme_id = ? AND is_active = 1`,
            [officer_id, programme_id]
        );

        if (existing.length > 0) {
            return res.status(409).json({ error: 'This officer is already assigned to this programme' });
        }

        await db.promise().query(
            `INSERT INTO officer_assignments (officer_id, programme_id, assigned_by) 
            VALUES (?, ?, ?)`,
            [officer_id, programme_id, assigned_by]
        );
        res.status(201).json({ message: 'Assignment added successfully' });
    } catch (error) {
        console.error('Error creating assignment:', error.message);
        res.status(500).json({ error: 'Error adding assignment' });
    }
});

// API endpoint to remove an assignment
api.post('/assignments/:id/remove', async (req, res) => {
    const assignmentId = req.params.id;
    try {
        await db.promise().query(
            `UPDATE officer_assignments SET is_active = 0 
            WHERE id = ?`,
            [assignmentId]
        );
        res.json({ message: 'Assignment removed successfully' });
    } catch (error) {
        console.error('Error removing assignment:', error.message);
        res.status(500).json({ error: 'Error removing assignment' });
    }
});



api.listen(PORT, () => {
    console.log(`API is running on port ${PORT}`);
});
