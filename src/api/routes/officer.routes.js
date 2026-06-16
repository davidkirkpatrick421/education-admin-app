import { Router } from 'express';
import * as statsController from '../controllers/stats.controller.js';
import * as studentController from '../controllers/student.controller.js';
import * as moduleController from '../controllers/module.controller.js';
import * as classificationController from '../controllers/classification.controller.js';

// Mounted at /officer
const router = Router();

// Dashboard stats for an assigned programme.
router.get('/stats/:programme_id', statsController.officerStats);

// Specific student-collection routes must precede the /students/:id matcher.
router.get('/students/export/:programme_id', studentController.exportByProgramme);
router.get('/students/programme/:programme_id', studentController.listByProgramme);
router.post('/students', studentController.create);

// Single student.
router.get('/students/:id', studentController.getById);
router.post('/students/:id/edit', studentController.update);
router.post('/students/:id/delete', studentController.remove);

// Module results for a student.
router.post('/students/:id/modules', moduleController.upsert);
router.get('/students/:id/modules/:module_id', moduleController.getById);
router.post('/students/:id/modules/:module_id/edit', moduleController.update);

// Classification workflow for a student.
router.post('/students/:id/classify', classificationController.classify);
router.post('/students/:id/classify/confirm', classificationController.confirm);
router.post('/students/:id/classify/override', classificationController.override);
router.post('/students/:id/classify/remove', classificationController.remove);

export default router;
