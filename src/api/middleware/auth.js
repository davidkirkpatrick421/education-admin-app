import jwt from 'jsonwebtoken';

// Verify the internal JWT minted by the web tier. Rejects any request that did
// not originate from the web server (only it holds INTERNAL_JWT_SECRET). When the
// token carries a user, populate req.user for downstream role/ownership checks.
export function requireService(req, res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const payload = jwt.verify(token, process.env.INTERNAL_JWT_SECRET);
        if (payload.sub) {
            req.user = { id: payload.sub, role: payload.role };
        }
        next();
    } catch {
        return res.status(401).json({ error: 'Unauthorized' });
    }
}

// Require an authenticated user whose role is one of the allowed roles.
export function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        next();
    };
}
