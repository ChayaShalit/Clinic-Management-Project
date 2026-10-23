import express from 'express'
import { getMySchedule, updateMySchedule } from '../controllers/doctorScheduleController.js'
import { auth, authDoctor } from '../middlewares/auth.middleware.js'

const router = express.Router()

// רק רופא מחובר יכול לראות ולעדכן את שעות העבודה שלו
router.get('/', auth, authDoctor, getMySchedule)
router.put('/', auth, authDoctor, updateMySchedule)

export const doctorScheduleRouter = router
