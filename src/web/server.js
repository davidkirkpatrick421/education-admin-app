import express from 'express';
import session from 'express-session';
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

web.use(session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    rolling: true,
    saveUninitialized: false,
    cookie: {
        secure: false, // HTTP
        maxAge: 1000 * 60 * 60 // 1 hour
    }
}));

web.set('view engine', 'ejs');
web.set('views', path.join(__dirname, 'views'));

web.use(express.static(path.join(__dirname, '/public')));
web.use(express.urlencoded({ extended: true }));

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
