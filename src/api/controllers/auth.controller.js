import bcrypt from 'bcrypt';
import * as userModel from '../models/user.model.js';
import * as assignmentModel from '../models/assignment.model.js';

// POST /login — authenticate a user and return their profile (+ assignments for officers).
export async function login(req, res) {
    const { email, password } = req.body;

    try {
        const user = await userModel.findActiveByEmail(email);
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        let assignments = [];
        if (user.role === 'officer') {
            assignments = await assignmentModel.listActiveForOfficer(user.id);
        }

        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                first_name: user.first_name,
                surname: user.surname,
                role: user.role,
                assignments
            }
        });
    } catch (error) {
        console.error('Error during login:', error.message);
        res.status(500).json({ error: 'Error during login' });
    }
}
