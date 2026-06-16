import { query } from '../db/pool.js';

export async function listProgrammes() {
    return query(`SELECT * FROM programmes`);
}

// id + title only, for the assignment form dropdown.
export async function listProgrammeOptions() {
    return query(`SELECT id, title FROM programmes`);
}

export async function findById(id) {
    const rows = await query(`SELECT * FROM programmes WHERE id = ?`, [id]);
    return rows[0] || null;
}

export async function create(p) {
    return query(
        `INSERT INTO programmes
        (code, title, y2_weight, y3_weight, resit_cap_enabled, resit_cap_mark, board_deadline)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [p.code, p.title, p.y2_weight, p.y3_weight, p.resit_cap_enabled, p.resit_cap_mark, p.board_deadline]
    );
}

export async function update(id, p) {
    return query(
        `UPDATE programmes SET code = ?, title = ?, y2_weight = ?, y3_weight = ?,
        resit_cap_enabled = ?, resit_cap_mark = ?, board_deadline = ?
        WHERE id = ?`,
        [p.code, p.title, p.y2_weight, p.y3_weight, p.resit_cap_enabled, p.resit_cap_mark, p.board_deadline, id]
    );
}

// Count of programmes (admin stats).
export async function countAll() {
    const rows = await query(`SELECT * FROM programmes`);
    return rows.length;
}
