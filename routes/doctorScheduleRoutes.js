import express from 'express'
import { getMySchedule, updateMySchedule } from '../controllers/doctorScheduleController.js'
import { auth, authDoctor } from '../middlewares/auth.middleware.js'
import { validate } from '../middlewares/validate.middleware.js'
import { doctorScheduleSchema } from '../validators/appointment.validator.js'

const router = express.Router()

// רק רופא מחובר יכול לראות ולעדכן את שעות העבודה שלו
router.get('/', auth, authDoctor, getMySchedule)
router.put('/', auth, authDoctor, validate(doctorScheduleSchema), updateMySchedule)

export const doctorScheduleRouter = router
