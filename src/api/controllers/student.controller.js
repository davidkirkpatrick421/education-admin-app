import * as studentModel from '../models/student.model.js';
import * as moduleModel from '../models/moduleResult.model.js';
import * as classificationModel from '../models/classificationResult.model.js';
import * as programmeModel from '../models/programme.model.js';

// Convert an HTML checkbox value ('on' / undefined) to a 1/0 flag.
const checkbox = (value) => (value === 'on' ? 1 : 0);

// GET /officer/students/programme/:programme_id — students + classification summary.
export async function listByProgramme(req, res) {
    try {
        const students = await studentModel.listByProgrammeWithClassification(req.params.programme_id);
        res.json({ students });
    } catch (error) {
        console.error('Error fetching students:', error.message);
        res.status(500).json({ error: 'Error fetching students' });
    }
}

// GET /officer/students/export/:programme_id — confirmed results for export.
export async function exportByProgramme(req, res) {
    const { programme_id } = req.params;
    try {
        const programme = await programmeModel.findById(programme_id);
        if (!programme) {
            return res.status(404).json({ error: 'Programme not found' });
        }
        const students = await classificationModel.listConfirmedExport(programme_id);
        res.json({ programme, students });
    } catch (error) {
        console.error('Error exporting classifications:', error.message);
        res.status(500).json({ error: 'Error exporting classifications' });
    }
}

// POST /officer/students — add a new student.
export async function create(req, res) {
    const { student_number, first_name, surname, programme_id, academic_year } = req.body;
    try {
        await studentModel.create({
            student_number, first_name, surname, programme_id, academic_year,
            has_mc: checkbox(req.body.has_mc),
            mc_notes: req.body.mc_notes || null,
        });
        res.status(201).json({ message: 'Student added successfully' });
    } catch (error) {
        console.error('Error adding student:', error.message);
        res.status(500).json({ error: 'Error adding student' });
    }
}

// GET /officer/students/:id — student detail with modules + classification.
export async function getById(req, res) {
    const studentId = req.params.id;
    try {
        const student = await studentModel.findById(studentId);
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }
        const modules = await moduleModel.listByStudent(studentId);
        const classification = await classificationModel.findByStudent(studentId);

        res.json({ student, modules, classification: classification || null });
    } catch (error) {
        console.error('Error fetching student details:', error.message);
        res.status(500).json({ error: 'Error fetching student details' });
    }
}

// POST /officer/students/:id/edit — update student details.
export async function update(req, res) {
    const { student_number, first_name, surname, academic_year } = req.body;
    try {
        await studentModel.update(req.params.id, {
            student_number, first_name, surname, academic_year,
            has_mc: checkbox(req.body.has_mc),
            mc_notes: req.body.mc_notes || null,
        });
        res.json({ message: 'Student updated successfully' });
    } catch (error) {
        console.error('Error updating student:', error.message);
        res.status(500).json({ error: 'Error updating student' });
    }
}

// POST /officer/students/:id/delete — delete a student and their classification.
export async function remove(req, res) {
    const studentId = req.params.id;
    try {
        await classificationModel.removeByStudent(studentId);
        await studentModel.remove(studentId);
        res.json({ message: 'Student deleted successfully' });
    } catch (error) {
        console.error('Error deleting student:', error.message);
        res.status(500).json({ error: 'Error deleting student' });
    }
}
