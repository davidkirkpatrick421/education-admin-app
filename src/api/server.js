import express from 'express';
import dotenv from 'dotenv';
import './db/pool.js';

import { requireService, requireRole } from './middleware/auth.js';
import authRoutes from './routes/auth.routes.js';
import statsRoutes from './routes/stats.routes.js';
import officersRoutes from './routes/officers.routes.js';
import programmesRoutes from './routes/programmes.routes.js';
import assignmentsRoutes from './routes/assignments.routes.js';
import officerRoutes from './routes/officer.routes.js';

dotenv.config();

const api = express();
api.use(express.json());

const PORT = process.env.API_PORT;

// Liveness probe (public — used by Docker/monitoring).
api.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

// Every other route must come from the authenticated web tier.
api.use(requireService);

// Feature routers. Admin-only management endpoints and officer-only endpoints
// enforce role server-side (defence in depth on top of the web tier's guards).
api.use('/', authRoutes); // /login — service token only, no user role yet
api.use('/', statsRoutes); // /admin/stats — role enforced inside the router
api.use('/officers', requireRole('admin'), officersRoutes);
api.use('/programmes', requireRole('admin'), programmesRoutes);
api.use('/assignments', requireRole('admin'), assignmentsRoutes);
api.use('/officer', requireRole('officer'), officerRoutes);

api.listen(PORT, () => {
    console.log(`API is running on port ${PORT}`);
});

export default api;
