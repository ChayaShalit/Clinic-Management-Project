import Doctor from '../models/Doctor.model.js'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const isTime = (value) => typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
const toMinutes = (hhmm) => {
    const [h, m] = hhmm.split(':').map(Number)
    return h * 60 + m
}

const formatSchedule = (doctor) => ({
    appointmentDuration: doctor.appointmentDuration,
    workStartTime: doctor.workStartTime,
    workEndTime: doctor.workEndTime,
    dayOff: doctor.dayOff || null,
    breaks: (doctor.breaks || []).map(b => ({ startTime: b.startTime, endTime: b.endTime }))
})

// שליפת שעות העבודה של הרופא המחובר
export const getMySchedule = async (req, res, next) => {
    try {
        const doctor = await Doctor.findOne({ userId: req.currentUser.id })

        if (!doctor) {
            return res.status(404).json({ message: 'הרופא לא נמצא' })
        }

        return res.status(200).json({ schedule: formatSchedule(doctor) })
    } catch (err) {
        return next(err)
    }
}

// עדכון שעות העבודה של הרופא המחובר
export const updateMySchedule = async (req, res, next) => {
    try {
        const { appointmentDuration, workStartTime, workEndTime, dayOff, breaks = [] } = req.body

        if (!isTime(workStartTime) || !isTime(workEndTime)) {
            return res.status(400).json({ message: 'יש להזין שעות בפורמט תקין (למשל 08:00)' })
        }

        if (toMinutes(workStartTime) >= toMinutes(workEndTime)) {
            return res.status(400).json({ message: 'שעת הסיום חייבת להיות אחרי שעת ההתחלה' })
        }

        const duration = Number(appointmentDuration)
        if (!Number.isInteger(duration) || duration < 5 || duration > 120) {
            return res.status(400).json({ message: 'אורך תור חייב להיות בין 5 ל-120 דקות' })
        }

        if (dayOff && !DAYS.includes(dayOff)) {
            return res.status(400).json({ message: 'יום חופש לא תקין' })
        }

        if (!Array.isArray(breaks)) {
            return res.status(400).json({ message: 'רשימת ההפסקות לא תקינה' })
        }

        for (const b of breaks) {
            const valid = isTime(b?.startTime) && isTime(b?.endTime)
                && toMinutes(b.startTime) < toMinutes(b.endTime)
                && toMinutes(b.startTime) >= toMinutes(workStartTime)
                && toMinutes(b.endTime) <= toMinutes(workEndTime)

            if (!valid) {
                return res.status(400).json({ message: 'הפסקה חייבת להיות בתוך שעות העבודה, והסיום שלה אחרי ההתחלה' })
            }
        }

        const doctor = await Doctor.findOne({ userId: req.currentUser.id })

        if (!doctor) {
            return res.status(404).json({ message: 'הרופא לא נמצא' })
        }

        doctor.appointmentDuration = duration
        doctor.workStartTime = workStartTime
        doctor.workEndTime = workEndTime
        doctor.dayOff = dayOff || undefined
        doctor.breaks = breaks.map(b => ({ startTime: b.startTime, endTime: b.endTime }))

        await doctor.save()

        return res.status(200).json({ message: 'שעות העבודה עודכנו בהצלחה', schedule: formatSchedule(doctor) })
    } catch (err) {
        return next(err)
    }
}
