import { Router } from 'express';
import * as officerController from '../controllers/officer.controller.js';

// Mounted at /officers
const router = Router();

router.get('/', officerController.list);
router.post('/', officerController.create);
router.get('/:id', officerController.getById);
router.post('/:id/edit', officerController.update);
router.post('/:id/deactivate', officerController.deactivate);
router.post('/:id/reactivate', officerController.reactivate);

export default router;
