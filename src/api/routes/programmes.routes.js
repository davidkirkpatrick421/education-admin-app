import { Router } from 'express';
import * as programmeController from '../controllers/programme.controller.js';

// Mounted at /programmes
const router = Router();

router.get('/', programmeController.list);
router.get('/:id', programmeController.getById);
router.post('/', programmeController.create);
router.post('/:id/edit', programmeController.update);

export default router;
