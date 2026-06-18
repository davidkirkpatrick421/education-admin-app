import { Router } from 'express';
import { requireRole } from '../middleware/auth.js';
import * as statsController from '../controllers/stats.controller.js';

const router = Router();

router.get('/admin/stats', requireRole('admin'), statsController.adminStats);

export default router;
