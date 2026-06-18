import { query } from '../db/pool.js';

// Active user by email (used for login).
export async function findActiveByEmail(email) {
    const rows = await query(
        `SELECT * FROM users WHERE email = $1 AND is_active = TRUE`,
        [email]
    );
    return rows[0] || null;
}

// All officers (any active state) for the admin officer list.
export async function listOfficers() {
    return query(
        `SELECT id, email, first_name, surname, is_active, created_at
        FROM users WHERE role = $1`,
        ['officer']
    );
}

// Active officers only (id + name) for stats and assignment form data.
export async function listActiveOfficers() {
    return query(
        `SELECT id, first_name, surname FROM users
        WHERE role = $1 AND is_active = TRUE`,
        ['officer']
    );
}

// Count of active officers (admin stats).
export async function countActiveOfficers() {
    const rows = await query(
        `SELECT COUNT(*)::int AS count FROM users WHERE role = $1 AND is_active = TRUE`,
        ['officer']
    );
    return rows[0].count;
}

export async function createOfficer(email, firstName, surname, hashedPassword) {
    return query(
        `INSERT INTO users (email, first_name, surname, password, role)
        VALUES ($1, $2, $3, $4, $5)`,
        [email, firstName, surname, hashedPassword, 'officer']
    );
}

export async function findOfficerById(id) {
    const rows = await query(
        `SELECT id, email, first_name, surname, is_active
        FROM users WHERE id = $1 AND role = $2`,
        [id, 'officer']
    );
    return rows[0] || null;
}

export async function updateOfficer(id, email, firstName, surname) {
    return query(
        `UPDATE users SET email = $1, first_name = $2, surname = $3
        WHERE id = $4 AND role = $5`,
        [email, firstName, surname, id, 'officer']
    );
}

export async function setOfficerActive(id, isActive) {
    return query(
        `UPDATE users SET is_active = $1 WHERE id = $2 AND role = $3`,
        [isActive, id, 'officer']
    );
}
