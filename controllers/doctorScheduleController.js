import Doctor from '../models/Doctor.model.js'
import { AppError } from '../utils/AppError.js'

/*
 * ה-controller של שעות העבודה של הרופא: שליפה ועדכון של הלוח שלו.
 * מה שמוגדר כאן קובע מתי מטופלות יכולות לקבוע תור: validateAppointmentTime והיומן קוראים את
 * אותם נתונים (שעות, אורך תור, יום חופש והפסקות).
 * הרופא מזוהה לפי הטוקן, ולכן אי אפשר לשנות שעות של רופא אחר.
 */

// בוחרת מהרופא רק את השדות שנשלחים ללקוח (בלי מזהים ופרטים פנימיים)
const formatSchedule = (doctor) => ({
    appointmentDuration: doctor.appointmentDuration,
    workStartTime: doctor.workStartTime,
    workEndTime: doctor.workEndTime,
    dayOff: doctor.dayOff || null,
    breaks: (doctor.breaks || []).map(b => ({ startTime: b.startTime, endTime: b.endTime }))
})

// מחזירה את רשומת הרופא של המשתמש המחובר, ואם אין כזו זורקת 404.
// השגיאה עוברת ל-error middleware (Express 5 תופס גם שגיאות של async), ולכן אין try/catch
const getCurrentDoctor = async (currentUser) => {
    const doctor = await Doctor.findOne({ userId: currentUser.id })

    if (!doctor) {
        throw new AppError('הרופא לא נמצא', 404, 'not found')
    }

    return doctor
}

// שליפת שעות העבודה של הרופא המחובר. GET /doctors/me/schedule. רק רופא (authDoctor)
export const getMySchedule = async (req, res) => {
    const doctor = await getCurrentDoctor(req.currentUser)

    res.status(200).json({ schedule: formatSchedule(doctor) })
}

// עדכון שעות העבודה של הרופא המחובר. PUT /doctors/me/schedule. רק רופא (authDoctor).
// כל הבדיקות כבר נעשו ב-Joi (doctorScheduleSchema בקובץ הנתיבים): פורמט שעות, הסיום אחרי ההתחלה,
// אורך תור בין 5 ל-120, והפסקות בתוך שעות העבודה. לכן כאן רק שומרים.
// שימו לב: dayOff ריק ('' או null) נשמר כ-undefined, כלומר "אין יום חופש קבוע"
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
