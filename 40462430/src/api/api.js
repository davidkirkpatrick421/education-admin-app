import mysql from 'mysql2';
import express from 'express';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { classifyStudent } from '../web/classificationEngine.js';
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

    if (user.role === 'officer') {
        const assignmentQuery = `SELECT programme_id, programmes.title FROM officer_assignments 
        INNER JOIN programmes ON officer_assignments.programme_id = programmes.id 
        WHERE officer_assignments.officer_id = ? AND officer_assignments.is_active = 1`;

        const [assignments] = await db.promise().query(assignmentQuery, [user.id]);
        user.assignments = assignments;
    }

    res.json({
        message: 'Login successful',
        user: {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            surname: user.surname,
            role: user.role,
            assignments: user.assignments || []
        }
    });
});

api.get('/admin/stats', async (req, res) => {

    try {

        const [programmes] = await db.promise().query('SELECT * FROM programmes');
        const [officers] = await db.promise().query('SELECT * FROM users WHERE role = ? AND is_active = 1', ['officer']);
        const [students] = await db.promise().query('SELECT * FROM students');
        const [assignments] = await db.promise().query('SELECT * FROM officer_assignments WHERE is_active = 1');

        res.json({
            totalProgrammes: programmes.length,
            totalOfficers: officers.length,
            totalStudents: students.length,
            activeAssignments: assignments.length
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error.message);
        res.status(500).json({ error: 'Error fetching dashboard stats' });
    }
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

// API endpoint to fetch stats for an officer dashboard based on assigned programme
api.get('/officer/stats/:programme_id', async (req, res) => {
    const { programme_id } = req.params;

    try {

        const [students] = await db.promise().query(
            `SELECT *  
            FROM students 
            WHERE programme_id = ?`,
            [programme_id]
        );
        const [classifications] = await db.promise().query(
            `SELECT 
            * FROM classification_results 
            WHERE programme_id = ? 
            AND classification_code IS NOT NULL`,
            [programme_id]
        );

        /*  const [stats] = await db.promise().query(
              `SELECT COUNT(*) as total_assignments FROM officer_assignments 
              WHERE programme_id = ? AND is_active = 1`,
              [programme_id]
          );
          */


        res.json({
            totalStudents: students.length,
            totalClassifications: classifications.length,


        });
    } catch (error) {
        console.error('Error fetching officer stats:', error.message);
        res.status(500).json({ error: 'Error fetching officer stats' });
    }
});

// API endpoint to fetch all students for an officer based on assigned programme
api.get('/officer/students/programme/:programme_id', async (req, res) => {


    const { programme_id } = req.params;
    console.log('API students endpoint hit, programme_id:', programme_id);
    try {
        const [rows] = await db.promise().query(
            `SELECT students.*,
            classification_results.classification_code, 
            classification_results.classification_label,
            classification_results.is_eligible
            FROM students
            LEFT JOIN classification_results 
            ON students.id = classification_results.student_id
            WHERE students.programme_id = ?
            ORDER BY students.surname, students.first_name`,
            [programme_id]
        );
        res.json({ students: rows });
    } catch (error) {
        console.error('Error fetching students:', error.message);
        res.status(500).json({ error: 'Error fetching students' });
    }
});

// API endpoint to add a new student for an officer based on assigned programme
api.post('/officer/students', async (req, res) => {

    const { student_number, first_name, surname, programme_id, academic_year } = req.body;
    let has_mc; if (req.body.has_mc === 'on') {
        has_mc = 1;
    } else {
        has_mc = 0;
    }
    const mc_notes = req.body.mc_notes || null;

    try {
        await db.promise().query(
            `INSERT INTO students 
            (student_number, first_name, surname, programme_id, academic_year, has_mc, mc_notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [student_number, first_name, surname, programme_id, academic_year, has_mc, mc_notes]
        );
        res.status(201).json({ message: 'Student added successfully' });
    } catch (error) {
        console.error('Error adding student:', error.message);
        res.status(500).json({ error: 'Error adding student' });
    }
});

// API endpoint to fetch student details by id for officer dashboard
api.get('/officer/students/:id', async (req, res) => {
    const studentId = req.params.id;

    try {
        const [student] = await db.promise().query(
            `SELECT id, programme_id, student_number, first_name, surname, academic_year, has_mc, mc_notes 
            FROM students WHERE id = ?`,
            [studentId]
        );

        if (student.length === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }

        const [modules] = await db.promise().query(
            `SELECT * FROM module_results 
            WHERE student_id = ? 
            ORDER BY year_of_study, module_name`,
            [studentId]
        );
        const [classification] = await db.promise().query(
            `SELECT * FROM classification_results 
            WHERE student_id = ?`,
            [studentId]
        );


        res.json({
            student: student[0],
            modules: modules,
            classification: classification[0] || null
        });
    } catch (error) {
        console.error('Error fetching student details:', error.message);
        res.status(500).json({ error: 'Error fetching student details' });
    }
});

// API endpoint to update student details for an officer based on assigned programme
api.post('/officer/students/:id/edit', async (req, res) => {
    const studentId = req.params.id;
    const { student_number, first_name, surname, academic_year } = req.body;

    let has_mc;
    if (req.body.has_mc === 'on') {
        has_mc = 1;
    } else {
        has_mc = 0;
    }
    const mc_notes = req.body.mc_notes || null;

    try {
        await db.promise().query(
            `UPDATE students SET student_number = ?, 
            first_name = ?, surname = ?, academic_year = ?, has_mc = ?, mc_notes = ? 
            WHERE id = ?`,
            [student_number, first_name, surname, academic_year, has_mc, mc_notes, studentId]
        );
        res.json({ message: 'Student updated successfully' });
    } catch (error) {
        console.error('Error updating student:', error.message);
        res.status(500).json({ error: 'Error updating student' });
    }
});

// API endpoint to delete a student for an officer based on assigned programme
api.post('/officer/students/:id/delete', async (req, res) => {
    const studentId = req.params.id;

    try {
        await db.promise().query(
            `DELETE FROM students WHERE id = ?`,
            [studentId]
        );
        res.json({ message: 'Student deleted successfully' });
    } catch (error) {
        console.error('Error deleting student:', error.message);
        res.status(500).json({ error: 'Error deleting student' });
    }
});

// API endpoint to add or update a module result for a student for an officer based on assigned programme
api.post('/officer/students/:id/modules', async (req, res) => {
    const studentId = req.params.id;
    const { module_code, module_name, mark, year_of_study, credits } = req.body;

    let is_resit;
    if (req.body.is_resit === 'on') {
        is_resit = 1;
    } else {
        is_resit = 0;
    }

    try {
        const [existing] = await db.promise().query(
            `SELECT id FROM module_results 
            WHERE student_id = ? 
            AND module_code = ? AND year_of_study = ?`,
            [studentId, module_code, year_of_study]
        );

        if (existing.length > 0) {
            await db.promise().query(
                `UPDATE module_results 
            SET mark = ?, is_resit = ?
            WHERE student_id = ? AND module_code = ? AND year_of_study = ?`,
                [mark, is_resit, studentId, module_code, year_of_study]
            );
            return res.json({ message: 'Module result updated successfully' });
        } else {
            await db.promise().query(
                `INSERT INTO module_results 
            (student_id, module_code, module_name, mark, year_of_study, credits, is_resit) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [studentId, module_code, module_name, mark, year_of_study, credits, is_resit]
            );
            res.status(201).json({ message: 'Module result added successfully' });
        }
    } catch (error) {
        console.error('Error adding module result:', error.message);
        res.status(500).json({ error: 'Error adding module result' });
    }
});

// API endpoint to classify a student based on their module results and programme rules for an officer based on assigned programme
api.post('/officer/students/:id/classify', async (req, res) => {
    const studentId = req.params.id;

    try {
        const [student] = await db.promise().query(
            `SELECT id, programme_id FROM students WHERE id = ?`,
            [studentId]
        );

        if (student.length === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }

        const [modules] = await db.promise().query(
            `SELECT * FROM module_results 
            WHERE student_id = ? 
            ORDER BY year_of_study, module_name`,
            [studentId]
        );

        const [programmeRules] = await db.promise().query(
            `SELECT * FROM programmes WHERE id = ?`,
            [student[0].programme_id]
        );

        if (programmeRules.length === 0) {
            return res.status(404).json({ error: 'Programme rules not found' });
        }

        const classificationResult = classifyStudent(student[0], modules, programmeRules[0]);



        await db.promise().query(
            `INSERT INTO classification_results 
            (student_id, programme_id, year2_average, year3_average, final_average, classification_code, classification_label, is_eligible, ineligibility_reason, boundary_flag, rationale_log, calculated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
            year2_average = VALUES(year2_average),
            year3_average = VALUES(year3_average),
            final_average = VALUES(final_average),
            classification_code = VALUES(classification_code),
            classification_label = VALUES(classification_label),
            is_eligible = VALUES(is_eligible),
            ineligibility_reason = VALUES(ineligibility_reason),
            boundary_flag = VALUES(boundary_flag),
            rationale_log = VALUES(rationale_log),
            calculated_at = NOW()`,
            [
                student[0].id,
                student[0].programme_id,
                classificationResult.year2_average,
                classificationResult.year3_average,
                classificationResult.final_average,
                classificationResult.classification_code,
                classificationResult.classification_label,
                classificationResult.eligible ? 1 : 0,
                classificationResult.ineligibility_reason,
                classificationResult.boundary_flag ? 1 : 0,
                JSON.stringify(classificationResult.rationale)
            ]
        );

        res.json(classificationResult);
    } catch (error) {
        console.error('Error classifying student:', error.message);
        res.status(500).json({ error: 'Error classifying student' });
    }

});


api.listen(PORT, () => {
    console.log(`API is running on port ${PORT}`);
});
