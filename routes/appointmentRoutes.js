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

/**
 * @fileoverview
 * נתיבי התורים
 * כאן נקבע איזו כתובת מפעילה איזו פונקציה, ואילו שומרים רצים לפניה
 * כל הכתובות כאן מתחילות ב
 * /api/appointments
 * השומרים רצים לפי הסדר: מחוברת, תפקיד, בדיקות תקינות, ובדיקת זמנים
 * שימו לב לסדר: נתיבים ספציפיים באים לפני נתיב עם מזהה, כדי שהכתובת של התורים שלי לא תיחשב מזהה
 */

const router = express.Router();
// הורדת דוח תורי היום. רק רופאה. כפתור ההורדה בדף שלה
router.get('/doctor/my/today/pdf',
    auth,
    authDoctor,
    downloadTodayAppointmentsPDF
);
// התורים של הרופאה המחוברת. הדף הראשי של הרופאה
router.get('/doctor/my', auth, authDoctor, getMyDoctorAppointments);
// התורים של המטופלת המחוברת. הדף הראשי של המטופלת
router.get('/my', auth, authPatient, getMyAppointments);
// שעות תפוסות ביום מסוים. דף היומן. הנתונים בכתובת ועוברים בדיקת תקינות
router.get('/availability', auth, validate(availabilityQuerySchema, 'query'), getAvailability);
// קביעת תור חדש. רק מטופלת. עוברת בדיקת תקינות ובדיקת זמנים לפני הקונטרולר
router.post('/', auth, authPatient, validate(createAppointmentSchema), validateAppointmentTime, createAppointment);
// ביטול תור. כפתור הביטול בדף הראשי של המטופלת. ההרשאה נבדקת בתוך הקונטרולר
router.delete('/:id',auth, deleteAppointment);
// תורים של רופא לפי מזהה. כרגע לא בשימוש בלקוח
router.get('/doctor/:doctorId',auth,authDoctor, getDoctorAppointments);

export const appointmentrouter = router;