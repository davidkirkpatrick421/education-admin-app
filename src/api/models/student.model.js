import { query } from '../db/pool.js';

// Students on a programme with their latest classification summary (officer list).
export async function listByProgrammeWithClassification(programmeId) {
    return query(
        `SELECT students.*,
        classification_results.classification_code,
        classification_results.classification_label,
        classification_results.is_eligible,
        classification_results.confirmed_at,
        classification_results.override_applied
        FROM students
        LEFT JOIN classification_results
        ON students.id = classification_results.student_id
        WHERE students.programme_id = ?
        ORDER BY students.surname, students.first_name`,
        [programmeId]
    );
}

// Plain student rows for a programme (used for stat counts).
export async function listByProgramme(programmeId) {
    return query(`SELECT * FROM students WHERE programme_id = ?`, [programmeId]);
}

export async function create(s) {
    return query(
        `INSERT INTO students
        (student_number, first_name, surname, programme_id, academic_year, has_mc, mc_notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [s.student_number, s.first_name, s.surname, s.programme_id, s.academic_year, s.has_mc, s.mc_notes]
    );
}

// Full student record (officer student-detail page).
export async function findById(id) {
    const rows = await query(
        `SELECT id, programme_id, student_number, first_name, surname, academic_year, has_mc, mc_notes
        FROM students WHERE id = ?`,
        [id]
    );
    return rows[0] || null;
}

// Minimal record (id + programme_id) used when classifying.
export async function findBasicById(id) {
    const rows = await query(
        `SELECT id, programme_id FROM students WHERE id = ?`,
        [id]
    );
    return rows[0] || null;
}

export async function update(id, s) {
    return query(
        `UPDATE students SET student_number = ?, first_name = ?, surname = ?,
        academic_year = ?, has_mc = ?, mc_notes = ?
        WHERE id = ?`,
        [s.student_number, s.first_name, s.surname, s.academic_year, s.has_mc, s.mc_notes, id]
    );
}

export async function remove(id) {
    return query(`DELETE FROM students WHERE id = ?`, [id]);
}

// Count of all students (admin stats).
export async function countAll() {
    const rows = await query(`SELECT * FROM students`);
    return rows.length;
}
