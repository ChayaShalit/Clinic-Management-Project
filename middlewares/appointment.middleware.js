import Doctor from '../models/Doctor.model.js';
import { AppError } from '../utils/AppError.js';
import { DAYS, DAY_LABELS_HE, toMinutes } from '../utils/time.js';

/**
 * @fileoverview
 * השומר המותאם של התורים, זו דרישת חובה של המורה
 * הוא רץ לפני הפונקציה שקובעת תור, ובודק שהזמן שנבחר הגיוני
 * שאלות על הצורה של הנתונים נבדקות לפניו בבדיקות התקינות
 * כאן נבדקות רק שאלות שתלויות במסד הנתונים ובחוקי המרפאה
 */

/**
 * מה הוא עושה: בודק שהתאריך והשעה מתאימים לרופא שנבחר
 * מי קורא לו: הנתיב של קביעת תור, אחרי בדיקות התקינות ולפני הקונטרולר
 * כל בדיקה שנכשלת זורקת שגיאה עם הסבר, והבקשה נעצרת
 * אם הכול תקין, ממשיכים לפונקציה הבאה בשרשרת
 *
 * @param {Object} req הבקשה, בגוף שלה רופא, תאריך ושעה
 * @param {Object} res התשובה ללקוח
 * @param {Function} next ממשיכה לשלב הבא כשהכול תקין
 * @returns {Promise<void>} לא מחזיר ערך, זורק שגיאה כשהזמן לא תקין
 */
export const validateAppointmentTime = async (req, res, next) => {
    const { doctorId, date, time } = req.body;

    // בדיקה ראשונה: אפשר לקבוע תור רק ממחר ואילך
    const appointmentDate = new Date(date);
    const tomorrow = new Date();
    tomorrow.setHours(0, 0, 0, 0);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (appointmentDate < tomorrow) {
        throw new AppError('ניתן לקבוע תור החל ממחר.', 400, 'validation error');
    }

    // בדיקה שנייה: לא ביום שבת
    const dayName = DAYS[appointmentDate.getDay()];

    if (dayName === 'Saturday') {
        throw new AppError('לא ניתן לקבוע תורים ביום שבת.', 400, 'validation error');
    }

    // שולפים את הרופא מהמסד כדי לבדוק את שעות העבודה שלו
    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
        throw new AppError('הרופא לא נמצא במערכת.', 404, 'not found');
    }

    // בדיקה שלישית: לא ביום החופש הקבוע של הרופא
    if (doctor.dayOff === dayName) {
        throw new AppError(`הרופא אינו מקבל קהל ביום ${DAY_LABELS_HE[dayName]}.`, 400, 'validation error');
    }

    // בדיקה רביעית: השעה חייבת להיות בתוך שעות העבודה של הרופא
    const requested = toMinutes(time);

    if (requested < toMinutes(doctor.workStartTime) || requested >= toMinutes(doctor.workEndTime)) {
        throw new AppError(
            `הרופא לא עובד בשעה זו. שעות הפעילות הן ${doctor.workStartTime} - ${doctor.workEndTime}.`,
            400,
            'validation error'
        );
    }

    // בדיקה חמישית: השעה לא יכולה להיות בזמן הפסקה
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

    // כל הבדיקות עברו, ממשיכים לפונקציה הבאה
    next();
};
