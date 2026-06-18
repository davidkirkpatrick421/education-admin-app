import * as moduleModel from '../models/moduleResult.model.js';
import * as classificationModel from '../models/classificationResult.model.js';
import { requireFields, validMark, validCredits, validYearOfStudy } from '../lib/validate.js';

const checkbox = (value) => (value === 'on' ? 1 : 0);

// Validate a module result payload; returns an error message or null.
function validateModule(body) {
    return requireFields(body, ['module_code', 'module_name', 'mark', 'year_of_study', 'credits'])
        || validMark(body.mark)
        || validCredits(body.credits)
        || validYearOfStudy(body.year_of_study);
}

// Guard: module results cannot change once a classification is confirmed.
async function isClassificationConfirmed(studentId) {
    const classification = await classificationModel.findConfirmedAt(studentId);
    return Boolean(classification && classification.confirmed_at);
}

// POST /officer/students/:id/modules — add or update a module result (by code + year).
export async function upsert(req, res) {
    const studentId = req.params.id;
    const { module_code, module_name, mark, year_of_study, credits } = req.body;
    const is_resit = checkbox(req.body.is_resit);

    const validationError = validateModule(req.body);
    if (validationError) {
        return res.status(400).json({ error: validationError });
    }

    try {
        if (await isClassificationConfirmed(studentId)) {
            return res.status(400).json({ error: 'Cannot update module results for a student with a confirmed classification' });
        }

        const existing = await moduleModel.findByKey(studentId, module_code, year_of_study);
        if (existing) {
            await moduleModel.updateByKey(studentId, module_code, year_of_study, mark, is_resit);
            return res.json({ message: 'Module result updated successfully' });
        }

        await moduleModel.insert(studentId, { module_code, module_name, mark, year_of_study, credits, is_resit });
        res.status(201).json({ message: 'Module result added successfully' });
    } catch (error) {
        console.error('Error adding module result:', error.message);
        res.status(500).json({ error: 'Error adding module result' });
    }
}

// GET /officer/students/:id/modules/:module_id — fetch one module result.
export async function getById(req, res) {
    try {
        const module = await moduleModel.findById(req.params.module_id, req.params.id);
        if (!module) {
            return res.status(404).json({ error: 'Module result not found' });
        }
        res.json({ module });
    } catch (error) {
        console.error('Error fetching module result details:', error.message);
        res.status(500).json({ error: 'Error fetching module result details' });
    }
}

// POST /officer/students/:id/modules/:module_id/edit — update a module result by id.
export async function update(req, res) {
    const studentId = req.params.id;
    const moduleId = req.params.module_id;
    const { module_code, module_name, mark, year_of_study, credits } = req.body;
    const is_resit = checkbox(req.body.is_resit);

    const validationError = validateModule(req.body);
    if (validationError) {
        return res.status(400).json({ error: validationError });
    }

    try {
        if (await isClassificationConfirmed(studentId)) {
            return res.status(400).json({ error: 'Cannot update module results for a student with a confirmed classification' });
        }

        await moduleModel.updateById(moduleId, studentId, { module_code, module_name, mark, year_of_study, credits, is_resit });
        res.json({ message: 'Module result updated successfully' });
    } catch (error) {
        console.error('Error updating module result:', error.message);
        res.status(500).json({ error: 'Error updating module result' });
    }
}
