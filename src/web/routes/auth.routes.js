import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireLogin } from '../middleware/auth.js';
import * as authController from '../controllers/auth.controller.js';

const router = Router();

// Throttle login attempts per client IP to blunt credential brute-forcing.
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many login attempts, please try again later.',
});

router.get('/', authController.root);
router.get('/login', authController.loginPage);
router.post('/login', loginLimiter, authController.login);
router.get('/dashboard', requireLogin, authController.dashboard);
router.get('/logout', authController.logout);

export default router;
