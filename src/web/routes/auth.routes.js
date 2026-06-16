import { Router } from 'express';
import { requireLogin } from '../middleware/auth.js';
import * as authController from '../controllers/auth.controller.js';

const router = Router();

router.get('/', authController.root);
router.get('/login', authController.loginPage);
router.post('/login', authController.login);
router.get('/dashboard', requireLogin, authController.dashboard);
router.get('/logout', authController.logout);

export default router;
