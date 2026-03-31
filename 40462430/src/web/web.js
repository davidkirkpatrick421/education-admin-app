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

// Authentication and role-based access middleware

const isAuthenticated = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    next();
};

const isAdmin = (req, res, next) => {
    if (req.session.user.role !== 'admin') {
        return res.redirect('/login');
    }
    next();
};

const isOfficer = (req, res, next) => {
    if (req.session.user.role !== 'officer') {
        return res.redirect('/login');
    }
    next();
};


// Routes

web.get("/", (req, res) => {
    res.redirect("/login");
});

// User login functions as the web landing page if not logged in. so root redirects to it.
web.get('/login', (req, res) => {
    res.render('login', { error: null });
});

// Handle login form submission to auth via API

web.post('/login', async (req, res) => {

    const { email, password } = req.body;

    try {
        const authResult = await axios.post(`${process.env.API_BASE_URL}/login`, { email, password });

        req.session.user = authResult.data.user;

        if (authResult.data.user.role === 'admin') {
            console.log('Admin login successful');
            res.redirect('/admin/dashboard');
        } else if (authResult.data.user.role === 'officer') {
            console.log('Officer login successful');
            res.redirect('/officer/dashboard');
        } else {
            console.log('Invalid role login attempt');
            res.status(403).send('Access denied');
        }
    } catch (error) {
        console.error('Login error:', error.message);
        res.render('login', { error: 'Invalid email or password' });
    }
});

// Dashboard route that redirects users to their respective dashboards based on role

web.get('/dashboard', isAuthenticated, (req, res) => {

    if (req.session.user.role === 'admin') {
        res.redirect('/admin/dashboard');
    } else if (req.session.user.role === 'officer') {
        res.redirect('/officer/dashboard');
    } else {
        res.status(403).send('Access denied');
    }
});

web.get('/admin/dashboard', isAuthenticated, isAdmin, (req, res) => {
    res.render('admin/dashboard');
});

web.get('/admin/officers', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const response = await axios.get(`${process.env.API_BASE_URL}/officers`);
        const officerData = response.data.officers;
        res.render('admin/officers', { officers: officerData });
    } catch (error) {
        console.error('Error fetching officers:', error.message);
        res.status(500).send('Error fetching officers');
    }
});



web.get('/officer/dashboard', isAuthenticated, isOfficer, (req, res) => {
    res.render('officer/dashboard');
});




web.get('/logout', (req, res) => {
    req.session.destroy();
    console.log('User logged out successfully');
    res.redirect('/login');

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