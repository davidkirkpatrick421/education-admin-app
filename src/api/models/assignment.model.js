import { query } from '../db/pool.js';

// Active assignments for an officer, with programme titles (used at login).
export async function listActiveForOfficer(officerId) {
    return query(
        `SELECT programme_id, programmes.title FROM officer_assignments
        INNER JOIN programmes ON officer_assignments.programme_id = programmes.id
        WHERE officer_assignments.officer_id = $1 AND officer_assignments.is_active = TRUE`,
        [officerId]
    );
}

// All active assignments with officer + programme details for the admin list.
export async function listActiveDetailed() {
    return query(
        `SELECT officer_assignments.id, officer_assignments.is_active,
        officer_assignments.assigned_at, users.id as officer_id,
        users.first_name, users.surname, users.email,
        programmes.id as programme_id, programmes.title as programme_title,
        programmes.code
        FROM officer_assignments
        INNER JOIN users ON officer_assignments.officer_id = users.id
        INNER JOIN programmes ON officer_assignments.programme_id = programmes.id
        WHERE officer_assignments.is_active = TRUE
        ORDER BY programmes.title, users.surname`
    );
}

// Existing active assignment for an officer/programme pair (duplicate guard).
export async function findActive(officerId, programmeId) {
    const rows = await query(
        `SELECT id FROM officer_assignments
        WHERE officer_id = $1 AND programme_id = $2 AND is_active = TRUE`,
        [officerId, programmeId]
    );
    return rows[0] || null;
}

export async function create(officerId, programmeId, assignedBy) {
    return query(
        `INSERT INTO officer_assignments (officer_id, programme_id, assigned_by)
        VALUES ($1, $2, $3)`,
        [officerId, programmeId, assignedBy]
    );
}

export async function deactivate(id) {
    return query(
        `UPDATE officer_assignments SET is_active = FALSE WHERE id = $1`,
        [id]
    );
}

// Count of active assignments (admin stats).
export async function countActive() {
    const rows = await query(`SELECT COUNT(*)::int AS count FROM officer_assignments WHERE is_active = TRUE`);
    return rows[0].count;
}
