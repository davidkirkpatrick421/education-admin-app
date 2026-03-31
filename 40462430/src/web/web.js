import express from 'express';
import axios from 'axios';
import session from 'express-session';
import dotenv from 'dotenv';
dotenv.config();

const web = express();
const PORT = process.env.WEB_PORT;

web.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // HTTP 
        maxAge: 1000 * 60 * 60 // 1 hour

    }
}));

import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

web.set("view engine", "ejs");
web.set("views", path.join(__dirname, "views"));

//middleware
web.use(express.static(path.join(__dirname, "/public")));
web.use(express.urlencoded({ extended: true }));

web.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

web.get("/", async (req, res) => {
    res.redirect("/login");
});

// User login functions as the web landing page if not logged in. so root redirects to it.
web.get('/login', async (req, res) => {
    res.render('login', { error: null });
});


web.post('/login', async (req, res) => {

    const { email, password } = req.body;

    try {
        const authResult = await axios.post(`${process.env.API_BASE_URL}/login`, { email, password });

        req.session.user = authResult.data.user;

        if (authResult.data.user.role === 'admin') {
            console.log('Admin login successful');
            res.redirect('/admin/dashboard');
        } else {
            console.log('Officer login successful');
            res.redirect('/officer/dashboard');
        }
    } catch (error) {
        console.error('Login error:', error.message);
        res.render('login', { error: 'Invalid email or password' });
    }
});

web.get('/dashboard', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    if (req.session.user.role === 'admin') {
        res.redirect('/admin/dashboard');
    } else if (req.session.user.role === 'officer') {
        res.redirect('/officer/dashboard');
    } else {
        res.status(403).send('Access denied');
    }
});

web.get('/admin/dashboard', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).send('Access denied');
        res.redirect('/login');
    }
    res.render('admin/dashboard');
});

web.get('/officer/dashboard', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'officer') {
        return res.status(403).send('Access denied');
        res.redirect('/login');
    }
    res.render('officer/dashboard');
});

web.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
    console.log('User logged out successfully');
});

/*
app.get("/dashboard", async (req, res) => {

    const ep = 'http://localhost:5000/getallstores';
    const apiResult = await axios.get(ep);
    const stores = apiResult.data.stores;
    const count = apiResult.data.totalStores;
    res.render("dashboard", { stores, count });
});
*/


web.listen(PORT, (err) => {
    console.log(`listening on port http://localhost:${PORT}`);
});