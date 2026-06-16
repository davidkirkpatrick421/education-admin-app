import { query } from '../db/pool.js';

// All module results for a student, ordered by year then name.
export async function listByStudent(studentId) {
    return query(
        `SELECT * FROM module_results
        WHERE student_id = ?
        ORDER BY year_of_study, module_name`,
        [studentId]
    );
}

// Existing module for a student by code + year (upsert guard).
export async function findByKey(studentId, moduleCode, yearOfStudy) {
    const rows = await query(
        `SELECT id FROM module_results
        WHERE student_id = ? AND module_code = ? AND year_of_study = ?`,
        [studentId, moduleCode, yearOfStudy]
    );
    return rows[0] || null;
}

export async function findById(moduleId, studentId) {
    const rows = await query(
        `SELECT * FROM module_results WHERE id = ? AND student_id = ?`,
        [moduleId, studentId]
    );
    return rows[0] || null;
}

export async function insert(studentId, m) {
    return query(
        `INSERT INTO module_results
        (student_id, module_code, module_name, mark, year_of_study, credits, is_resit)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [studentId, m.module_code, m.module_name, m.mark, m.year_of_study, m.credits, m.is_resit]
    );
}

// Update mark/resit for an existing student+code+year row.
export async function updateByKey(studentId, moduleCode, yearOfStudy, mark, isResit) {
    return query(
        `UPDATE module_results
        SET mark = ?, is_resit = ?
        WHERE student_id = ? AND module_code = ? AND year_of_study = ?`,
        [mark, isResit, studentId, moduleCode, yearOfStudy]
    );
}

export async function updateById(moduleId, studentId, m) {
    return query(
        `UPDATE module_results
        SET module_code = ?, module_name = ?, mark = ?, year_of_study = ?, credits = ?, is_resit = ?
        WHERE id = ? AND student_id = ?`,
        [m.module_code, m.module_name, m.mark, m.year_of_study, m.credits, m.is_resit, moduleId, studentId]
    );
}
