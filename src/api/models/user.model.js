import { query } from '../db/pool.js';

// Active user by email (used for login).
export async function findActiveByEmail(email) {
    const rows = await query(
        `SELECT * FROM users WHERE email = ? AND is_active = 1`,
        [email]
    );
    return rows[0] || null;
}

// All officers (any active state) for the admin officer list.
export async function listOfficers() {
    return query(
        `SELECT id, email, first_name, surname, is_active, created_at
        FROM users WHERE role = ?`,
        ['officer']
    );
}

// Active officers only (id + name) for stats and assignment form data.
export async function listActiveOfficers() {
    return query(
        `SELECT id, first_name, surname FROM users
        WHERE role = ? AND is_active = 1`,
        ['officer']
    );
}

// Count of active officers (admin stats).
export async function countActiveOfficers() {
    const rows = await query(
        `SELECT * FROM users WHERE role = ? AND is_active = 1`,
        ['officer']
    );
    return rows.length;
}

export async function createOfficer(email, firstName, surname, hashedPassword) {
    return query(
        `INSERT INTO users (email, first_name, surname, password, role)
        VALUES (?, ?, ?, ?, ?)`,
        [email, firstName, surname, hashedPassword, 'officer']
    );
}

export async function findOfficerById(id) {
    const rows = await query(
        `SELECT id, email, first_name, surname, is_active
        FROM users WHERE id = ? AND role = ?`,
        [id, 'officer']
    );
    return rows[0] || null;
}

export async function updateOfficer(id, email, firstName, surname) {
    return query(
        `UPDATE users SET email = ?, first_name = ?, surname = ?
        WHERE id = ? AND role = ?`,
        [email, firstName, surname, id, 'officer']
    );
}

export async function setOfficerActive(id, isActive) {
    return query(
        `UPDATE users SET is_active = ? WHERE id = ? AND role = ?`,
        [isActive, id, 'officer']
    );
}
