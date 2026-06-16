import { Router } from 'express';
import { requireLogin, requireOfficer } from '../middleware/auth.js';
import * as officer from '../controllers/officer.controller.js';

// Mounted at /officer — every route requires an authenticated officer.
const router = Router();
router.use(requireLogin, requireOfficer);

router.get('/dashboard', officer.dashboard);
router.post('/select-programme', officer.selectProgramme);

// Specific student-collection routes must precede the /students/:id matcher.
router.get('/students/export', officer.exportStudents);
router.get('/students', officer.studentsList);
router.get('/students/new', officer.studentNewPage);
router.post('/students/new', officer.studentCreate);

// Single student.
router.get('/students/:id', officer.studentDetail);
router.get('/students/:id/edit', officer.studentEditPage);
router.post('/students/:id/edit', officer.studentUpdate);
router.post('/students/:id/delete', officer.studentDelete);

// Module results.
router.get('/students/:id/modules/new', officer.moduleNewPage);
router.post('/students/:id/modules', officer.moduleCreate);
router.get('/students/:id/modules/:moduleId/edit', officer.moduleEditPage);
router.post('/students/:id/modules/:moduleId/edit', officer.moduleUpdate);

// Classification workflow.
router.post('/students/:id/classify', officer.classify);
router.post('/students/:id/classify/override', officer.classifyOverride);
router.get('/students/:id/classify/override', officer.classifyOverridePage);
router.post('/students/:id/classify/confirm', officer.classifyConfirm);
router.post('/students/:id/classify/remove', officer.classifyRemove);

export default router;
