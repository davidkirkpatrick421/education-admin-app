import { query } from '../db/pool.js';

// Active assignments for an officer, with programme titles (used at login).
export async function listActiveForOfficer(officerId) {
    return query(
        `SELECT programme_id, programmes.title FROM officer_assignments
        INNER JOIN programmes ON officer_assignments.programme_id = programmes.id
        WHERE officer_assignments.officer_id = ? AND officer_assignments.is_active = 1`,
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
        WHERE officer_assignments.is_active = 1
        ORDER BY programmes.title, users.surname`
    );
}

// Existing active assignment for an officer/programme pair (duplicate guard).
export async function findActive(officerId, programmeId) {
    const rows = await query(
        `SELECT id FROM officer_assignments
        WHERE officer_id = ? AND programme_id = ? AND is_active = 1`,
        [officerId, programmeId]
    );
    return rows[0] || null;
}

export async function create(officerId, programmeId, assignedBy) {
    return query(
        `INSERT INTO officer_assignments (officer_id, programme_id, assigned_by)
        VALUES (?, ?, ?)`,
        [officerId, programmeId, assignedBy]
    );
}

export async function deactivate(id) {
    return query(
        `UPDATE officer_assignments SET is_active = 0 WHERE id = ?`,
        [id]
    );
}

// Count of active assignments (admin stats).
export async function countActive() {
    const rows = await query(`SELECT * FROM officer_assignments WHERE is_active = 1`);
    return rows.length;
}
