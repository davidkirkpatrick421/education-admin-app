import express from 'express';

import { requireService, requireRole } from './middleware/auth.js';
import authRoutes from './routes/auth.routes.js';
import statsRoutes from './routes/stats.routes.js';
import officersRoutes from './routes/officers.routes.js';
import programmesRoutes from './routes/programmes.routes.js';
import assignmentsRoutes from './routes/assignments.routes.js';
import officerRoutes from './routes/officer.routes.js';

// Builds the API Express app. Kept separate from server.js so tests can import
// the app (via supertest) without starting a listener or connecting to the DB.
export function createApp() {
    const api = express();
    api.use(express.json());

    // Liveness probe (public).
    api.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

    // Every route below requires a valid internal token from the web tier.
    api.use(requireService);

    api.use('/', authRoutes); // /login — service token only, no user role yet
    api.use('/', statsRoutes); // /admin/stats — role enforced inside the router
    api.use('/officers', requireRole('admin'), officersRoutes);
    api.use('/programmes', requireRole('admin'), programmesRoutes);
    api.use('/assignments', requireRole('admin'), assignmentsRoutes);
    api.use('/officer', requireRole('officer'), officerRoutes);

    return api;
}

export default createApp;
