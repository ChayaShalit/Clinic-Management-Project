import Doctor from '../models/Doctor.model.js'
import { AppError } from '../utils/AppError.js'

const formatSchedule = (doctor) => ({
    appointmentDuration: doctor.appointmentDuration,
    workStartTime: doctor.workStartTime,
    workEndTime: doctor.workEndTime,
    dayOff: doctor.dayOff || null,
    breaks: (doctor.breaks || []).map(b => ({ startTime: b.startTime, endTime: b.endTime }))
})

// הרופא המחובר. שגיאות נזרקות ל-error middleware (Express 5 תופס גם שגיאות של async)
const getCurrentDoctor = async (currentUser) => {
    const doctor = await Doctor.findOne({ userId: currentUser.id })

    if (!doctor) {
        throw new AppError('הרופא לא נמצא', 404, 'not found')
    }

    return doctor
}

// שליפת שעות העבודה של הרופא המחובר
export const getMySchedule = async (req, res) => {
    const doctor = await getCurrentDoctor(req.currentUser)

    res.status(200).json({ schedule: formatSchedule(doctor) })
}

// עדכון שעות העבודה של הרופא המחובר
// בדיקות התקינות נעשות לפני כן, ב-validate(doctorScheduleSchema) שבקובץ הנתיבים
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
