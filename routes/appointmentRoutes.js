import express from 'express';
import {
    createAppointment,
    deleteAppointment,
    getDoctorAppointments,
    getMyAppointments,
    getMyDoctorAppointments,
    downloadTodayAppointmentsPDF,
    getAvailability
} from '../controllers/appointmentController.js';
import { validateAppointmentTime } from '../middlewares/appointment.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createAppointmentSchema, availabilityQuerySchema } from '../validators/appointment.validator.js';
import {auth,authPatient,authDoctor} from '../middlewares/auth.middleware.js'

const router = express.Router();
router.get('/doctor/my/today/pdf',
    auth,
    authDoctor,
    downloadTodayAppointmentsPDF
);
router.get('/doctor/my', auth, authDoctor, getMyDoctorAppointments);
router.get('/my', auth, authPatient, getMyAppointments);
router.get('/availability', auth, validate(availabilityQuerySchema, 'query'), getAvailability);
router.post('/', auth, authPatient, validate(createAppointmentSchema), validateAppointmentTime, createAppointment);
router.delete('/:id',auth, deleteAppointment);
router.get('/doctor/:doctorId',auth,authDoctor, getDoctorAppointments);

export const appointmentrouter = router;