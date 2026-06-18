import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

// A fixed secret for the test run. requireService reads this at request time,
// and we sign tokens with the same value to emulate the web tier.
process.env.INTERNAL_JWT_SECRET = 'test-internal-secret';

// Stub the DB pool so importing the app never opens a real Postgres connection.
vi.mock('./db/pool.js', () => ({ query: vi.fn(), default: {} }));

// Mock the model layer so behaviour is driven by the tests, not a database.
vi.mock('./models/user.model.js');
vi.mock('./models/assignment.model.js');
vi.mock('./models/student.model.js');
vi.mock('./models/moduleResult.model.js');
vi.mock('./models/classificationResult.model.js');
vi.mock('./models/programme.model.js');

import * as userModel from './models/user.model.js';
import * as assignmentModel from './models/assignment.model.js';
import * as studentModel from './models/student.model.js';
import * as moduleModel from './models/moduleResult.model.js';
import * as classificationModel from './models/classificationResult.model.js';
import * as programmeModel from './models/programme.model.js';
import { createApp } from './app.js';

const app = createApp();

// Sign an internal token the way the web tier's apiClient does.
const sign = (payload) => jwt.sign(payload, process.env.INTERNAL_JWT_SECRET, { expiresIn: '60s' });
const adminToken = sign({ sub: 1, role: 'admin' });
const officerToken = sign({ sub: 2, role: 'officer' }); // officer id 2
const serviceToken = sign({ svc: true });                // logged-out web tier call

// bcrypt hash of "admin123" (same as the seed data) so the real compare passes.
const ADMIN_HASH = '$2b$10$rOlHrOcH1hiymHoTBXS3EO8f8s9puJd4kT9Fw4EaWzGiELQZkOuDe';

beforeEach(() => {
    vi.clearAllMocks();
});

describe('API security: service auth (requireService)', () => {
    it('allows /health with no token (public)', async () => {
        const res = await request(app).get('/health');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ status: 'ok' });
    });

    it('rejects a request with no Authorization header (401)', async () => {
        const res = await request(app).get('/officers');
        expect(res.status).toBe(401);
    });

    it('rejects a malformed bearer token (401)', async () => {
        const res = await request(app).get('/officers').set('Authorization', 'Bearer not-a-jwt');
        expect(res.status).toBe(401);
    });

    it('rejects a token signed with the wrong secret (401)', async () => {
        const forged = jwt.sign({ sub: 1, role: 'admin' }, 'wrong-secret');
        const res = await request(app).get('/officers').set('Authorization', `Bearer ${forged}`);
        expect(res.status).toBe(401);
    });
});

describe('API security: role enforcement (requireRole)', () => {
    it('forbids an officer from an admin-only route (403)', async () => {
        const res = await request(app).get('/officers').set('Authorization', `Bearer ${officerToken}`);
        expect(res.status).toBe(403);
    });

    it('allows an admin on an admin-only route (200)', async () => {
        userModel.listOfficers.mockResolvedValue([]);
        const res = await request(app).get('/officers').set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ officers: [] });
    });

    it('forbids an admin from an officer-only route (403)', async () => {
        const res = await request(app).get('/officer/students/1').set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(403);
    });

    it('allows an admin on /admin/stats (200)', async () => {
        programmeModel.countAll.mockResolvedValue(2);
        userModel.countActiveOfficers.mockResolvedValue(2);
        studentModel.countAll.mockResolvedValue(8);
        assignmentModel.countActive.mockResolvedValue(3);
        const res = await request(app).get('/admin/stats').set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ totalProgrammes: 2, totalOfficers: 2, totalStudents: 8, activeAssignments: 3 });
    });
});

describe('API security: login (/login)', () => {
    it('requires a service token to reach login (401 without one)', async () => {
        const res = await request(app).post('/login').send({ email: 'a@b.c', password: 'x' });
        expect(res.status).toBe(401);
    });

    it('authenticates a valid admin and returns the profile (200)', async () => {
        userModel.findActiveByEmail.mockResolvedValue({
            id: 1, email: 'admin@hedclass.demo', first_name: 'Admin', surname: 'User',
            role: 'admin', password: ADMIN_HASH,
        });
        const res = await request(app).post('/login')
            .set('Authorization', `Bearer ${serviceToken}`)
            .send({ email: 'admin@hedclass.demo', password: 'admin123' });
        expect(res.status).toBe(200);
        expect(res.body.user).toMatchObject({ id: 1, role: 'admin', email: 'admin@hedclass.demo' });
        expect(res.body.user.password).toBeUndefined(); // never leak the hash
    });

    it('rejects a wrong password (401)', async () => {
        userModel.findActiveByEmail.mockResolvedValue({ id: 1, role: 'admin', password: ADMIN_HASH });
        const res = await request(app).post('/login')
            .set('Authorization', `Bearer ${serviceToken}`)
            .send({ email: 'admin@hedclass.demo', password: 'wrong' });
        expect(res.status).toBe(401);
    });

    it('rejects an unknown email (401)', async () => {
        userModel.findActiveByEmail.mockResolvedValue(null);
        const res = await request(app).post('/login')
            .set('Authorization', `Bearer ${serviceToken}`)
            .send({ email: 'nobody@hedclass.demo', password: 'admin123' });
        expect(res.status).toBe(401);
    });
});

describe('API security: programme ownership (ensureStudentAccess)', () => {
    it('forbids an officer acting on a student outside their programmes (403)', async () => {
        studentModel.findBasicById.mockResolvedValue({ id: 5, programme_id: 2 });
        assignmentModel.findActive.mockResolvedValue(null); // officer 2 not assigned to prog 2
        const res = await request(app).get('/officer/students/5').set('Authorization', `Bearer ${officerToken}`);
        expect(res.status).toBe(403);
    });

    it('allows an officer on a student within their assigned programme (200)', async () => {
        studentModel.findBasicById.mockResolvedValue({ id: 1, programme_id: 1 });
        assignmentModel.findActive.mockResolvedValue({ id: 10 }); // assigned
        studentModel.findById.mockResolvedValue({ id: 1, programme_id: 1, first_name: 'Emma' });
        moduleModel.listByStudent.mockResolvedValue([]);
        classificationModel.findByStudent.mockResolvedValue(null);
        const res = await request(app).get('/officer/students/1').set('Authorization', `Bearer ${officerToken}`);
        expect(res.status).toBe(200);
        expect(res.body.student).toMatchObject({ id: 1 });
    });
});

describe('API security: input validation', () => {
    it('rejects a module mark outside 0–100 (400)', async () => {
        // ownership passes so we reach the controller's validation
        studentModel.findBasicById.mockResolvedValue({ id: 1, programme_id: 1 });
        assignmentModel.findActive.mockResolvedValue({ id: 10 });
        const res = await request(app)
            .post('/officer/students/1/modules')
            .set('Authorization', `Bearer ${officerToken}`)
            .send({ module_code: 'X', module_name: 'Y', year_of_study: 1, credits: 20, mark: 150 });
        expect(res.status).toBe(400);
    });
});
