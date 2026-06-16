import * as assignmentModel from '../models/assignment.model.js';
import * as userModel from '../models/user.model.js';
import * as programmeModel from '../models/programme.model.js';

// GET /assignments — active assignments with officer + programme details.
export async function list(req, res) {
    try {
        const assignments = await assignmentModel.listActiveDetailed();
        res.json({ assignments });
    } catch (error) {
        console.error('Error fetching assignments:', error.message);
        res.status(500).json({ error: 'Error fetching assignments' });
    }
}

// GET /assignments/form-data — active officers + programmes for the assignment form.
export async function formData(req, res) {
    try {
        const officers = await userModel.listActiveOfficers();
        const programmes = await programmeModel.listProgrammeOptions();
        res.json({ officers, programmes });
    } catch (error) {
        console.error('Error fetching form data:', error.message);
        res.status(500).json({ error: 'Error fetching form data' });
    }
}

// POST /assignments — add an assignment, guarding against active duplicates.
export async function create(req, res) {
    const { officer_id, programme_id, assigned_by } = req.body;
    try {
        const existing = await assignmentModel.findActive(officer_id, programme_id);
        if (existing) {
            return res.status(409).json({ error: 'This officer is already assigned to this programme' });
        }

        await assignmentModel.create(officer_id, programme_id, assigned_by);
        res.status(201).json({ message: 'Assignment added successfully' });
    } catch (error) {
        console.error('Error creating assignment:', error.message);
        res.status(500).json({ error: 'Error adding assignment' });
    }
}

// POST /assignments/:id/remove — soft-remove (deactivate) an assignment.
export async function remove(req, res) {
    try {
        await assignmentModel.deactivate(req.params.id);
        res.json({ message: 'Assignment removed successfully' });
    } catch (error) {
        console.error('Error removing assignment:', error.message);
        res.status(500).json({ error: 'Error removing assignment' });
    }
}
