import express from 'express';
import {
    createAppointment,
    updateAppointment,
    deleteAppointment,
    getDoctorAppointments,
    getMyAppointments,
    getMyDoctorAppointments,
    downloadTodayAppointmentsPDF
} from '../controllers/appointmentController.js';
import { validateAppointmentTime } from '../middlewares/appointment.middleware.js';
import {auth,authPatient,authDoctor} from '../middlewares/auth.middleware.js'

const router = express.Router();
router.get(
    '/doctor/my/today/pdf',
    auth,
    authDoctor,
    downloadTodayAppointmentsPDF
);
router.get('/doctor/my', auth, authDoctor, getMyDoctorAppointments);
router.get('/my', auth, authPatient, getMyAppointments);
router.post('/',auth,authPatient, validateAppointmentTime, createAppointment);
router.put('/:id', auth, validateAppointmentTime, updateAppointment);
router.delete('/:id',auth, deleteAppointment);
router.get('/doctor/:doctorId',auth,authDoctor, getDoctorAppointments);

export const appointmentrouter = router;