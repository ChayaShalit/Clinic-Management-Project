import express from 'express'
import { getMySchedule, updateMySchedule } from '../controllers/doctorScheduleController.js'
import { auth, authDoctor } from '../middlewares/auth.middleware.js'
import { validate } from '../middlewares/validate.middleware.js'
import { doctorScheduleSchema } from '../validators/appointment.validator.js'

/**
 * @fileoverview
 * נתיבי שעות העבודה של הרופא
 * הם מחוברים בקובץ הראשי של השרת תחת הכתובת
 * /api/doctors/me/schedule
 * בכל נתיב השומרים רצים לפי הסדר, משמאל לימין
 */

const router = express.Router()

// שליפת שעות העבודה. רק רופא מחובר. הדף קורא לזה כשהוא נפתח
router.get('/', auth, authDoctor, getMySchedule)
// שמירת שעות עבודה. רק רופא מחובר, ולפני הקונטרולר עוברות בדיקות התקינות
router.put('/', auth, authDoctor, validate(doctorScheduleSchema), updateMySchedule)

export const doctorScheduleRouter = router
