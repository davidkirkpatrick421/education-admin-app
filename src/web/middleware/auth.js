// Session-based auth + role guards for the web tier.

// Expose the logged-in user to all views and default an officer's active programme.
export function attachUserLocals(req, res, next) {
    res.locals.user = req.session.user || null;

    if (req.session.user && req.session.user.role === 'officer') {
        if (!req.session.activeProgrammeId && req.session.user.assignments.length > 0) {
            req.session.activeProgrammeId = req.session.user.assignments[0].programme_id;
        }
        res.locals.activeProgrammeId = req.session.activeProgrammeId;
    }

    next();
}

export function requireLogin(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    next();
}

export function requireAdmin(req, res, next) {
    if (req.session.user?.role !== 'admin') {
        return res.redirect('/login');
    }
    next();
}

export function requireOfficer(req, res, next) {
    if (req.session.user?.role !== 'officer') {
        return res.redirect('/login');
    }
    next();
}
