import { Router } from 'express';
import { ensureProgrammeAccess, ensureStudentAccess } from '../middleware/ownership.js';
import * as statsController from '../controllers/stats.controller.js';
import * as studentController from '../controllers/student.controller.js';
import * as moduleController from '../controllers/module.controller.js';
import * as classificationController from '../controllers/classification.controller.js';

// Mounted at /officer (already gated to role 'officer'). Each route additionally
// verifies the officer is assigned to the relevant programme.
const router = Router();

// Dashboard stats for an assigned programme.
router.get('/stats/:programme_id', ensureProgrammeAccess, statsController.officerStats);

// Specific student-collection routes must precede the /students/:id matcher.
router.get('/students/export/:programme_id', ensureProgrammeAccess, studentController.exportByProgramme);
router.get('/students/programme/:programme_id', ensureProgrammeAccess, studentController.listByProgramme);
router.post('/students', ensureProgrammeAccess, studentController.create);

// Single student.
router.get('/students/:id', ensureStudentAccess, studentController.getById);
router.post('/students/:id/edit', ensureStudentAccess, studentController.update);
router.post('/students/:id/delete', ensureStudentAccess, studentController.remove);

// Module results for a student.
router.post('/students/:id/modules', ensureStudentAccess, moduleController.upsert);
router.get('/students/:id/modules/:module_id', ensureStudentAccess, moduleController.getById);
router.post('/students/:id/modules/:module_id/edit', ensureStudentAccess, moduleController.update);

// Classification workflow for a student.
router.post('/students/:id/classify', ensureStudentAccess, classificationController.classify);
router.post('/students/:id/classify/confirm', ensureStudentAccess, classificationController.confirm);
router.post('/students/:id/classify/override', ensureStudentAccess, classificationController.override);
router.post('/students/:id/classify/remove', ensureStudentAccess, classificationController.remove);

export default router;
