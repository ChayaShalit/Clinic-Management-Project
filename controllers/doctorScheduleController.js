import Doctor from '../models/Doctor.model.js'
import { AppError } from '../utils/AppError.js'

/**
 * @fileoverview
 * קונטרולר שעות העבודה של הרופא: שליפה ועדכון
 * מה שנשמר כאן קובע מתי מטופלות יכולות לקבוע תור
 * היומן בלקוח ובדיקת הזמנים בשרת קוראים את אותם נתונים
 * הרופא מזוהה לפי הטוקן, ולכן אי אפשר לשנות שעות של רופא אחר
 */

/**
 * מה היא עושה: בוחרת מהרופא רק את השדות שנשלחים ללקוח
 * כך לא נשלחים מזהים ופרטים פנימיים
 *
 * @param {Object} doctor הרופא כפי שנשמר במסד
 * @returns {Object} שעות העבודה בצורה שנשלחת ללקוח
 */
const formatSchedule = (doctor) => ({
    appointmentDuration: doctor.appointmentDuration,
    workStartTime: doctor.workStartTime,
    workEndTime: doctor.workEndTime,
    dayOff: doctor.dayOff || null,
    breaks: (doctor.breaks || []).map(b => ({ startTime: b.startTime, endTime: b.endTime }))
})

/**
 * מה היא עושה: מוצאת את הרופא של המשתמש המחובר
 * אם אין רופא כזה, זורקת שגיאה 404
 *
 * @param {Object} currentUser המשתמש המחובר, עם מזהה ותפקיד מהטוקן
 * @returns {Promise<Object>} רשומת הרופא
 */
const getCurrentDoctor = async (currentUser) => {
    const doctor = await Doctor.findOne({ userId: currentUser.id })

    if (!doctor) {
        throw new AppError('הרופא לא נמצא', 404, 'not found')
    }

    return doctor
}

/**
 * מה היא עושה: מחזירה את שעות העבודה של הרופא המחובר
 * מי קורא לה: דף שעות העבודה, כשהוא נפתח, כדי למלא את הטופס
 * הכתובת בשרת
 * GET /api/doctors/me/schedule
 *
 * @param {Object} req הבקשה, ובה הרופא המחובר
 * @param {Object} res התשובה ללקוח
 * @returns {Promise<void>} שולחת תשובה ללקוח ולא מחזירה ערך
 */
export const getMySchedule = async (req, res) => {
    const doctor = await getCurrentDoctor(req.currentUser)

    res.status(200).json({ schedule: formatSchedule(doctor) })
}

/**
 * מה היא עושה: שומרת את שעות העבודה החדשות של הרופא
 * מי קורא לה: דף שעות העבודה, כשהרופא לוחץ על שמירה
 * כל בדיקות התקינות כבר נעשו לפני כן, ולכן כאן רק שומרים
 * יום חופש ריק נשמר כאילו אין יום חופש קבוע
 * מה חוזר ללקוח: הודעת הצלחה והשעות כפי שנשמרו
 * הכתובת בשרת
 * PUT /api/doctors/me/schedule
 *
 * @param {Object} req הבקשה, בגוף שלה שעות העבודה החדשות
 * @param {Object} res התשובה ללקוח
 * @returns {Promise<void>} שולחת תשובה ללקוח ולא מחזירה ערך
 */
export const updateMySchedule = async (req, res) => {
    const { appointmentDuration, workStartTime, workEndTime, dayOff, breaks } = req.body

    const doctor = await getCurrentDoctor(req.currentUser)

    doctor.appointmentDuration = appointmentDuration
    doctor.workStartTime = workStartTime
    doctor.workEndTime = workEndTime
    doctor.dayOff = dayOff || undefined
    doctor.breaks = breaks.map(b => ({ startTime: b.startTime, endTime: b.endTime }))

    await doctor.save()

    res.status(200).json({ message: 'שעות העבודה עודכנו בהצלחה', schedule: formatSchedule(doctor) })
}
