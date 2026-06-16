import { Router } from 'express';
import { requireLogin, requireAdmin } from '../middleware/auth.js';
import * as admin from '../controllers/admin.controller.js';

// Mounted at /admin — every route requires an authenticated admin.
const router = Router();
router.use(requireLogin, requireAdmin);

router.get('/dashboard', admin.dashboard);

// Officers
router.get('/officers', admin.officersList);
router.get('/officers/new', admin.officerNew);
router.post('/officers', admin.officerCreate);
router.get('/officers/:id/edit', admin.officerEditPage);
router.post('/officers/:id/edit', admin.officerUpdate);
router.post('/officers/:id/deactivate', admin.officerDeactivate);
router.post('/officers/:id/reactivate', admin.officerReactivate);

// Programmes
router.get('/programmes', admin.programmesList);
router.get('/programmes-new', admin.programmeNew);
router.post('/programmes', admin.programmeCreate);
router.get('/programmes/:id/edit', admin.programmeEditPage);
router.post('/programmes/:id/edit', admin.programmeUpdate);

// Assignments
router.get('/assignments', admin.assignmentsList);
router.get('/assignments-new', admin.assignmentNew);
router.post('/assignments', admin.assignmentCreate);
router.post('/assignments/:id/remove', admin.assignmentRemove);

export default router;
