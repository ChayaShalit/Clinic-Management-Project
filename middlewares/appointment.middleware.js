import Doctor from '../models/Doctor.model.js';
import Appointment from '../models/Appointment.model.js';
import { AppError } from '../utils/AppError.js';
import { DAYS, DAY_LABELS_HE, toMinutes } from '../utils/time.js';

// Middleware מותאם: בודק שהזמן של התור חוקי (מחר ואילך, לא שבת, לא יום חופש,
// בתוך שעות העבודה של הרופא ולא בזמן הפסקה). מצורת הנתונים (פורמט) דואג Joi לפני כן
export const validateAppointmentTime = async (req, res, next) => {
    let { doctorId, date, time } = req.body;

    // בעדכון (PUT) יש id בכתובת: משלימים את הנתונים החסרים מהתור הקיים
    if (req.params.id) {
        // אם לא משנים תאריך או שעה (למשל רק סטטוס), אין מה לבדוק
        if (!date && !time) {
            return next();
        }

        const existing = await Appointment.findById(req.params.id);
        if (!existing) {
            throw new AppError('התור לא נמצא', 404, 'not found');
        }

        doctorId = doctorId || existing.doctorId;
        date = date || existing.date;
        time = time || existing.time;
    }

    const appointmentDate = new Date(date);
    const tomorrow = new Date();
    tomorrow.setHours(0, 0, 0, 0);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (appointmentDate < tomorrow) {
        throw new AppError('ניתן לקבוע תור החל ממחר.', 400, 'validation error');
    }

    const dayName = DAYS[appointmentDate.getDay()];

    if (dayName === 'Saturday') {
        throw new AppError('לא ניתן לקבוע תורים ביום שבת.', 400, 'validation error');
    }

    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
        throw new AppError('הרופא לא נמצא במערכת.', 404, 'not found');
    }

    if (doctor.dayOff === dayName) {
        throw new AppError(`הרופא אינו מקבל קהל ביום ${DAY_LABELS_HE[dayName]}.`, 400, 'validation error');
    }

    const requested = toMinutes(time);

    if (requested < toMinutes(doctor.workStartTime) || requested >= toMinutes(doctor.workEndTime)) {
        throw new AppError(
            `הרופא לא עובד בשעה זו. שעות הפעילות הן ${doctor.workStartTime} - ${doctor.workEndTime}.`,
            400,
            'validation error'
        );
    }

    const overlappingBreak = (doctor.breaks || []).find(
        b => requested >= toMinutes(b.startTime) && requested < toMinutes(b.endTime)
    );

    if (overlappingBreak) {
        throw new AppError(
            `לא ניתן לקבוע תור בזמן הפסקה (${overlappingBreak.startTime} - ${overlappingBreak.endTime}).`,
            400,
            'validation error'
        );
    }

    next();
};
