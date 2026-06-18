import bcrypt from 'bcrypt';
import * as userModel from '../models/user.model.js';
import { requireFields, validEmail } from '../lib/validate.js';

// GET /officers — list all officers for the admin dashboard.
export async function list(req, res) {
    try {
        const officers = await userModel.listOfficers();
        res.json({ officers });
    } catch (error) {
        console.error('Error fetching officers:', error.message);
        res.status(500).json({ error: 'Error fetching officers' });
    }
}

// POST /officers — create a new officer.
export async function create(req, res) {
    const { email, first_name, surname, password } = req.body;

    const validationError = requireFields(req.body, ['email', 'first_name', 'surname', 'password'])
        || validEmail(email)
        || (password.length < 8 ? 'Password must be at least 8 characters' : null);
    if (validationError) {
        return res.status(400).json({ error: validationError });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await userModel.createOfficer(email, first_name, surname, hashedPassword);
        res.status(201).json({ message: 'Officer created successfully' });
    } catch (error) {
        console.error('Error creating officer:', error.message);
        res.status(500).json({ error: 'Error creating officer' });
    }
}

// GET /officers/:id — fetch one officer for editing.
export async function getById(req, res) {
    try {
        const officer = await userModel.findOfficerById(req.params.id);
        if (!officer) {
            return res.status(404).json({ error: 'Officer not found' });
        }
        res.json({ officer });
    } catch (error) {
        console.error('Error fetching officer details:', error.message);
        res.status(500).json({ error: 'Error fetching officer details' });
    }
}

// POST /officers/:id/edit — update officer details.
export async function update(req, res) {
    const { email, first_name, surname } = req.body;
    try {
        await userModel.updateOfficer(req.params.id, email, first_name, surname);
        res.json({ message: 'Officer updated successfully' });
    } catch (error) {
        console.error('Error updating officer:', error.message);
        res.status(500).json({ error: 'Error updating officer' });
    }
}

// POST /officers/:id/deactivate
export async function deactivate(req, res) {
    try {
        await userModel.setOfficerActive(req.params.id, 0);
        res.json({ message: 'Officer deactivated successfully' });
    } catch (error) {
        console.error('Error deactivating officer:', error.message);
        res.status(500).json({ error: 'Error deactivating officer' });
    }
}

// POST /officers/:id/reactivate
export async function reactivate(req, res) {
    try {
        await userModel.setOfficerActive(req.params.id, 1);
        res.json({ message: 'Officer reactivated successfully' });
    } catch (error) {
        console.error('Error reactivating officer:', error.message);
        res.status(500).json({ error: 'Error reactivating officer' });
    }
}
