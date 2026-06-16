import express from 'express';
import dotenv from 'dotenv';
import './db/pool.js';

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

// Liveness probe (used by Docker/monitoring).
api.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

// Feature routers.
api.use('/', authRoutes);
api.use('/', statsRoutes);
api.use('/officers', officersRoutes);
api.use('/programmes', programmesRoutes);
api.use('/assignments', assignmentsRoutes);
api.use('/officer', officerRoutes);

api.listen(PORT, () => {
    console.log(`API is running on port ${PORT}`);
});

export default api;
