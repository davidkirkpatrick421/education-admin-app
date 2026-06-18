import express from 'express';
import session from 'express-session';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { attachUserLocals } from './middleware/auth.js';
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import officerRoutes from './routes/officer.routes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const web = express();
const PORT = process.env.WEB_PORT;

// Trust the reverse proxy (Nginx) so secure cookies work behind TLS termination.
web.set('trust proxy', 1);

// Security headers. CSP allows the jsDelivr CDN (Bootstrap + Chart.js) and
// inline styles (Bootstrap and template style attributes); scripts stay strict
// ('self' + CDN only, no inline) since the chart script is externalised.
web.use(helmet({
    contentSecurityPolicy: {
        directives: {
            scriptSrc: ["'self'", 'https://cdn.jsdelivr.net'],
            styleSrc: ["'self'", 'https://cdn.jsdelivr.net', "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:'],
        },
    },
}));

web.use(session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    rolling: true,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // HTTPS-only in production
        maxAge: 1000 * 60 * 60 // 1 hour
    }
}));

web.set('view engine', 'ejs');
web.set('views', path.join(__dirname, 'views'));

web.use(express.static(path.join(__dirname, '/public')));
web.use(express.urlencoded({ extended: true }));

// Liveness probe (used by Docker/monitoring).
web.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

// Expose the current user (and officer's active programme) to all views.
web.use(attachUserLocals);

// Feature routers.
web.use('/', authRoutes);
web.use('/admin', adminRoutes);
web.use('/officer', officerRoutes);

web.listen(PORT, () => {
    console.log(`listening on port http://localhost:${PORT}`);
});

export default web;
