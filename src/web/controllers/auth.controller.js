import apiClient from '../apiClient.js';

// GET / — landing redirects to login.
export function root(req, res) {
    res.redirect('/login');
}

// GET /login — login page (also the landing page when logged out).
export function loginPage(req, res) {
    res.render('login', { error: null });
}

// POST /login — authenticate via the API and start a session.
export async function login(req, res) {
    const { email, password } = req.body;

    try {
        const authResult = await apiClient.post('/login', { email, password });
        req.session.user = authResult.data.user;

        if (authResult.data.user.role === 'admin') {
            res.redirect('/admin/dashboard');
        } else if (authResult.data.user.role === 'officer') {
            res.redirect('/officer/dashboard');
        } else {
            res.status(403).send('Access denied');
        }
    } catch (error) {
        console.error('Login error:', error.message);
        res.render('login', { error: 'Invalid email or password' });
    }
}

// GET /dashboard — route a logged-in user to their role dashboard.
export function dashboard(req, res) {
    if (req.session.user.role === 'admin') {
        res.redirect('/admin/dashboard');
    } else if (req.session.user.role === 'officer') {
        res.redirect('/officer/dashboard');
    } else {
        res.status(403).send('Access denied');
    }
}

// GET /logout
export function logout(req, res) {
    req.session.destroy();
    res.redirect('/login');
}
