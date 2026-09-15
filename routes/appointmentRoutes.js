import express from 'express';
import { createAppointment, updateAppointment, deleteAppointment, getDoctorAppointments } from '../controllers/appointmentController.js';
import { validateAppointmentTime } from '../middlewares/appointment.middleware.js';

const router = express.Router();

router.post('/', validateAppointmentTime, createAppointment);
router.put('/:id', updateAppointment);
router.delete('/:id', deleteAppointment);
router.get('/doctor/:doctorId', getDoctorAppointments);

export default router;