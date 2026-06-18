import { query } from '../db/pool.js';

export async function listProgrammes() {
    return query(`SELECT * FROM programmes`);
}

// id + title only, for the assignment form dropdown.
export async function listProgrammeOptions() {
    return query(`SELECT id, title FROM programmes`);
}

export async function findById(id) {
    const rows = await query(`SELECT * FROM programmes WHERE id = $1`, [id]);
    return rows[0] || null;
}

export async function create(p) {
    return query(
        `INSERT INTO programmes
        (code, title, y2_weight, y3_weight, resit_cap_enabled, resit_cap_mark, board_deadline)
        VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [p.code, p.title, p.y2_weight, p.y3_weight, p.resit_cap_enabled, p.resit_cap_mark, p.board_deadline]
    );
}

export async function update(id, p) {
    return query(
        `UPDATE programmes SET code = $1, title = $2, y2_weight = $3, y3_weight = $4,
        resit_cap_enabled = $5, resit_cap_mark = $6, board_deadline = $7
        WHERE id = $8`,
        [p.code, p.title, p.y2_weight, p.y3_weight, p.resit_cap_enabled, p.resit_cap_mark, p.board_deadline, id]
    );
}

// Count of programmes (admin stats).
export async function countAll() {
    const rows = await query(`SELECT COUNT(*)::int AS count FROM programmes`);
    return rows[0].count;
}
