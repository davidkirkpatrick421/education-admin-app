import * as classificationModel from '../models/classificationResult.model.js';
import { classifyAndPersist, ServiceError } from '../services/classification.service.js';

const CLASSIFICATION_LABELS = {
    '1st': 'First Class Honours',
    '2:1': 'Upper Second Class Honours',
    '2:2': 'Lower Second Class Honours',
    '3rd': 'Third Class Honours',
    'fail': 'Fail'
};

// POST /officer/students/:id/classify — run the engine and persist the result.
export async function classify(req, res) {
    try {
        const result = await classifyAndPersist(req.params.id);
        res.json(result);
    } catch (error) {
        if (error instanceof ServiceError) {
            return res.status(error.status).json({ error: error.message });
        }
        console.error('Error classifying student:', error.message);
        res.status(500).json({ error: 'Error classifying student' });
    }
}

// POST /officer/students/:id/classify/confirm
export async function confirm(req, res) {
    const studentId = req.params.id;
    const { confirmed_by } = req.body;
    try {
        const existing = await classificationModel.findConfirmedAt(studentId);
        if (!existing) {
            return res.status(404).json({ error: 'Classification result not found' });
        }
        if (existing.confirmed_at) {
            return res.status(400).json({ error: 'Classification is already confirmed' });
        }

        await classificationModel.confirm(studentId, confirmed_by);
        res.json({ message: 'Classification confirmed successfully' });
    } catch (error) {
        console.error('Error confirming classification:', error.message);
        res.status(500).json({ error: 'Error confirming classification' });
    }
}

// POST /officer/students/:id/classify/override
export async function override(req, res) {
    const studentId = req.params.id;
    const { classification_code, override_rationale, override_by } = req.body;

    const classification_label = CLASSIFICATION_LABELS[classification_code];
    if (!classification_label) {
        return res.status(400).json({ error: 'Invalid classification code' });
    }

    try {
        const existing = await classificationModel.findConfirmedAt(studentId);
        if (!existing) {
            return res.status(404).json({ error: 'Classification result not found' });
        }
        if (existing.confirmed_at) {
            return res.status(403).json({ error: 'Cannot override a confirmed classification' });
        }

        await classificationModel.override(studentId, classification_code, classification_label, override_rationale, override_by);
        res.json({ message: 'Classification overridden successfully' });
    } catch (error) {
        console.error('Error overriding classification:', error.message);
        res.status(500).json({ error: 'Error overriding classification' });
    }
}

// POST /officer/students/:id/classify/remove
export async function remove(req, res) {
    const studentId = req.params.id;
    try {
        const existing = await classificationModel.findConfirmedAt(studentId);
        if (!existing) {
            return res.status(404).json({ error: 'Classification result not found' });
        }

        await classificationModel.removeByStudent(studentId);
        res.json({ message: 'Classification removed successfully' });
    } catch (error) {
        console.error('Error removing classification:', error.message);
        res.status(500).json({ error: 'Error removing classification' });
    }
}
