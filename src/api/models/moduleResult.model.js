import { query } from '../db/pool.js';

// All module results for a student, ordered by year then name.
export async function listByStudent(studentId) {
    return query(
        `SELECT * FROM module_results
        WHERE student_id = $1
        ORDER BY year_of_study, module_name`,
        [studentId]
    );
}

// Existing module for a student by code + year (upsert guard).
export async function findByKey(studentId, moduleCode, yearOfStudy) {
    const rows = await query(
        `SELECT id FROM module_results
        WHERE student_id = $1 AND module_code = $2 AND year_of_study = $3`,
        [studentId, moduleCode, yearOfStudy]
    );
    return rows[0] || null;
}

export async function findById(moduleId, studentId) {
    const rows = await query(
        `SELECT * FROM module_results WHERE id = $1 AND student_id = $2`,
        [moduleId, studentId]
    );
    return rows[0] || null;
}

export async function insert(studentId, m) {
    return query(
        `INSERT INTO module_results
        (student_id, module_code, module_name, mark, year_of_study, credits, is_resit)
        VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [studentId, m.module_code, m.module_name, m.mark, m.year_of_study, m.credits, m.is_resit]
    );
}

// Update mark/resit for an existing student+code+year row.
export async function updateByKey(studentId, moduleCode, yearOfStudy, mark, isResit) {
    return query(
        `UPDATE module_results
        SET mark = $1, is_resit = $2
        WHERE student_id = $3 AND module_code = $4 AND year_of_study = $5`,
        [mark, isResit, studentId, moduleCode, yearOfStudy]
    );
}

export async function updateById(moduleId, studentId, m) {
    return query(
        `UPDATE module_results
        SET module_code = $1, module_name = $2, mark = $3, year_of_study = $4, credits = $5, is_resit = $6
        WHERE id = $7 AND student_id = $8`,
        [m.module_code, m.module_name, m.mark, m.year_of_study, m.credits, m.is_resit, moduleId, studentId]
    );
}
