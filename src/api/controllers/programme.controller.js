import * as programmeModel from '../models/programme.model.js';

// GET /programmes
export async function list(req, res) {
    try {
        const programmes = await programmeModel.listProgrammes();
        res.json({ programmes });
    } catch (error) {
        console.error('Error fetching programmes:', error.message);
        res.status(500).json({ error: 'Error fetching programmes' });
    }
}

// GET /programmes/:id
export async function getById(req, res) {
    try {
        const programme = await programmeModel.findById(req.params.id);
        if (!programme) {
            return res.status(404).json({ error: 'Programme not found' });
        }
        res.json({ programme });
    } catch (error) {
        console.error('Error fetching programme details:', error.message);
        res.status(500).json({ error: 'Error fetching programme details' });
    }
}

// POST /programmes
export async function create(req, res) {
    try {
        await programmeModel.create(req.body);
        res.status(201).json({ message: 'Programme created successfully' });
    } catch (error) {
        console.error('Error creating programme:', error.message);
        res.status(500).json({ error: 'Error creating programme' });
    }
}

// POST /programmes/:id/edit
export async function update(req, res) {
    try {
        await programmeModel.update(req.params.id, req.body);
        res.json({ message: 'Programme updated successfully' });
    } catch (error) {
        console.error('Error updating programme:', error.message);
        res.status(500).json({ error: 'Error updating programme' });
    }
}
