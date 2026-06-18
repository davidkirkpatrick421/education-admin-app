import * as assignmentModel from '../models/assignment.model.js';
import * as studentModel from '../models/student.model.js';

// Confirm the acting officer is actively assigned to a programme.
async function isAssigned(officerId, programmeId) {
    return Boolean(await assignmentModel.findActive(officerId, programmeId));
}

// Guard programme-scoped routes: the programme id comes from the route param or
// (for creates) the request body.
export async function ensureProgrammeAccess(req, res, next) {
    const programmeId = req.params.programme_id ?? req.body.programme_id;
    try {
        if (!await isAssigned(req.user.id, programmeId)) {
            return res.status(403).json({ error: 'Not assigned to this programme' });
        }
        next();
    } catch (error) {
        console.error('Ownership check failed:', error.message);
        res.status(500).json({ error: 'Authorization check failed' });
    }
}

// Guard student-scoped routes: resolve the student's programme and confirm the
// officer is assigned to it. Caches the student on req for handlers to reuse.
export async function ensureStudentAccess(req, res, next) {
    try {
        const student = await studentModel.findBasicById(req.params.id);
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }
        if (!await isAssigned(req.user.id, student.programme_id)) {
            return res.status(403).json({ error: 'Not assigned to this programme' });
        }
        req.student = student;
        next();
    } catch (error) {
        console.error('Ownership check failed:', error.message);
        res.status(500).json({ error: 'Authorization check failed' });
    }
}
