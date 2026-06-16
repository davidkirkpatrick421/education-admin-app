import { Router } from 'express';
import * as assignmentController from '../controllers/assignment.controller.js';

// Mounted at /assignments
const router = Router();

router.get('/', assignmentController.list);
router.get('/form-data', assignmentController.formData);
router.post('/', assignmentController.create);
router.post('/:id/remove', assignmentController.remove);

export default router;
