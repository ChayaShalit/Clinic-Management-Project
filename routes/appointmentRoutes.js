import express from 'express';
import { createAppointment, updateAppointment, deleteAppointment } from '../controllers/appointmentController.js';
const router = express.Router();

router.post('/', createAppointment);
router.put('/:id', updateAppointment);
router.delete('/:id', deleteAppointment);

export default router;
