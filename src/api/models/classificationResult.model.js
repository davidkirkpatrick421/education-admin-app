import { query } from '../db/pool.js';

// The single classification row for a student (officer detail page).
export async function findByStudent(studentId) {
    const rows = await query(
        `SELECT * FROM classification_results WHERE student_id = $1`,
        [studentId]
    );
    return rows[0] || null;
}

// Only the confirmed_at flag for a student (workflow guards).
export async function findConfirmedAt(studentId) {
    const rows = await query(
        `SELECT confirmed_at FROM classification_results WHERE student_id = $1`,
        [studentId]
    );
    return rows[0] || null;
}

export async function listConfirmedByProgramme(programmeId) {
    return query(
        `SELECT * FROM classification_results
        WHERE programme_id = $1 AND confirmed_at IS NOT NULL`,
        [programmeId]
    );
}

// Students on a programme that have no classification row yet.
export async function listPendingByProgramme(programmeId) {
    return query(
        `SELECT students.id FROM students
        LEFT JOIN classification_results
        ON students.id = classification_results.student_id
        WHERE students.programme_id = $1
        AND classification_results.id IS NULL`,
        [programmeId]
    );
}

export async function listPendingReviewByProgramme(programmeId) {
    return query(
        `SELECT * FROM classification_results
        WHERE programme_id = $1 AND confirmed_at IS NULL`,
        [programmeId]
    );
}

export async function distributionByProgramme(programmeId) {
    return query(
        `SELECT classification_code, COUNT(*)::int as count
        FROM classification_results
        WHERE programme_id = $1
        GROUP BY classification_code`,
        [programmeId]
    );
}

export async function countIneligibleByProgramme(programmeId) {
    const rows = await query(
        `SELECT COUNT(*)::int as count
        FROM classification_results
        WHERE programme_id = $1 AND is_eligible = FALSE`,
        [programmeId]
    );
    return rows[0].count;
}

// Confirmed results for a programme with student details (export).
export async function listConfirmedExport(programmeId) {
    return query(
        `SELECT students.student_number, students.first_name, students.surname,
        classification_results.classification_code,
        classification_results.classification_label,
        classification_results.is_eligible,
        classification_results.ineligibility_reason,
        classification_results.override_applied,
        classification_results.override_rationale,
        classification_results.confirmed_at,
        classification_results.final_average
        FROM students
        INNER JOIN classification_results
        ON students.id = classification_results.student_id
        WHERE students.programme_id = $1
        AND classification_results.confirmed_at IS NOT NULL
        ORDER BY students.surname, students.first_name`,
        [programmeId]
    );
}

// Insert or update the calculated classification for a student.
export async function upsert(studentId, programmeId, result) {
    return query(
        `INSERT INTO classification_results
        (student_id, programme_id, year2_average, year3_average, final_average, classification_code, classification_label, is_eligible, ineligibility_reason, boundary_flag, rationale_log, calculated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, NOW())
        ON CONFLICT (student_id, programme_id) DO UPDATE SET
        year2_average = EXCLUDED.year2_average,
        year3_average = EXCLUDED.year3_average,
        final_average = EXCLUDED.final_average,
        classification_code = EXCLUDED.classification_code,
        classification_label = EXCLUDED.classification_label,
        is_eligible = EXCLUDED.is_eligible,
        ineligibility_reason = EXCLUDED.ineligibility_reason,
        boundary_flag = EXCLUDED.boundary_flag,
        rationale_log = EXCLUDED.rationale_log,
        calculated_at = NOW(),
        override_applied = FALSE,
        override_rationale = NULL,
        override_by = NULL,
        override_at = NULL,
        confirmed_by = NULL,
        confirmed_at = NULL`,
        [
            studentId,
            programmeId,
            result.year2_average,
            result.year3_average,
            result.final_average,
            result.classification_code,
            result.classification_label,
            result.eligible,
            result.ineligibility_reason,
            result.boundary_flag,
            JSON.stringify(result.rationale)
        ]
    );
}

export async function confirm(studentId, confirmedBy) {
    return query(
        `UPDATE classification_results
        SET confirmed_by = $1, confirmed_at = NOW()
        WHERE student_id = $2`,
        [confirmedBy, studentId]
    );
}

export async function override(studentId, classificationCode, classificationLabel, rationale, overrideBy) {
    return query(
        `UPDATE classification_results
        SET override_applied = TRUE,
        classification_code = $1,
        classification_label = $2,
        override_rationale = $3,
        override_by = $4,
        override_at = NOW()
        WHERE student_id = $5`,
        [classificationCode, classificationLabel, rationale, overrideBy, studentId]
    );
}

export async function removeByStudent(studentId) {
    return query(`DELETE FROM classification_results WHERE student_id = $1`, [studentId]);
}
