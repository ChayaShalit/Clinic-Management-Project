import Joi from 'joi';
import { DAYS, TIME_PATTERN, toMinutes } from '../utils/time.js';

/**
 * @fileoverview
 * בדיקות תקינות של הנתונים שנשלחים מהלקוח לשרת
 * הספרייה שבה משתמשים כאן נקראת
 * Joi
 * כל סכמה מתארת איך אמורה להיראות בקשה, והשרת דוחה בקשה שלא מתאימה
 * הבדיקות רצות לפני הקונטרולר, ולכן שם אין צורך לבדוק שוב את הצורה
 * אותן בדיקות קיימות גם בצד הלקוח, אבל כאן הן מחייבות כי אפשר לעקוף את הדפדפן
 */

// צורת תאריך תקינה: שנה, חודש ויום
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
// צורת מזהה תקין של מונגו, עשרים וארבעה תווים
const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

// חוק למזהה רופא: חובה, ובצורה של מזהה תקין
// מוגדר פעם אחת כי הוא משמש בשתי סכמות
const doctorIdField = Joi.string().pattern(OBJECT_ID_PATTERN).required().messages({
    'string.pattern.base': 'מזהה הרופא לא תקין',
    'string.empty': 'נא לבחור רופא',
    'any.required': 'נא לבחור רופא'
});

/**
 * חוק לשעה: חובה, ובצורה של שעה ודקות
 * מקבל את הודעת השגיאה שתוצג כשהשעה חסרה
 *
 * @param {string} requiredMessage ההודעה שתוצג כשהשעה חסרה
 * @returns {Object} חוק בדיקה לשעה
 */
const timeField = (requiredMessage) => Joi.string().pattern(TIME_PATTERN).required().messages({
    'string.pattern.base': 'יש להזין שעה בפורמט תקין (למשל 08:00)',
    'string.empty': requiredMessage,
    'any.required': requiredMessage
});

// הסכמה של קביעת תור חדש, מי משתמש בה: הנתיב שקובע תור
// המטופלת לא נשלחת בבקשה, כי השרת מזהה אותה מהטוקן
// סוג טיפול וקביעת תזכורת הם לא חובה
export const createAppointmentSchema = Joi.object({
    doctorId: doctorIdField,
    date: Joi.string().pattern(DATE_PATTERN).required().messages({
        'string.pattern.base': 'התאריך חייב להיות בפורמט שנה-חודש-יום',
        'string.empty': 'נא לבחור תאריך',
        'any.required': 'נא לבחור תאריך'
    }),
    time: timeField('נא לבחור שעה'),
    treatmentType: Joi.string().trim().max(50).allow('', null).messages({
        'string.max': 'סוג הטיפול ארוך מדי'
    }),
    wantsReminder: Joi.boolean().default(false).messages({
        'boolean.base': 'הבקשה לתזכורת לא תקינה'
    })
});

// הסכמה של שעות העבודה של הרופא, מי משתמש בה: הנתיב ששומר שעות עבודה
// בודקת שעות, אורך תור בין חמש למאה ועשרים דקות, יום חופש תקין והפסקות
export const doctorScheduleSchema = Joi.object({
    workStartTime: timeField('נא להזין שעת התחלה'),
    workEndTime: timeField('נא להזין שעת סיום'),
    appointmentDuration: Joi.number().integer().min(5).max(120).required().messages({
        'number.base': 'אורך תור חייב להיות מספר',
        'number.integer': 'אורך תור חייב להיות מספר שלם',
        'number.min': 'אורך תור חייב להיות בין 5 ל-120 דקות',
        'number.max': 'אורך תור חייב להיות בין 5 ל-120 דקות',
        'any.required': 'נא להזין אורך תור'
    }),
    dayOff: Joi.string().valid(...DAYS, '').allow(null).messages({
        'any.only': 'יום חופש לא תקין'
    }),
    breaks: Joi.array().items(
        Joi.object({
            startTime: timeField('נא להזין שעת התחלה להפסקה'),
            endTime: timeField('נא להזין שעת סיום להפסקה')
        })
    ).default([]).messages({
        'array.base': 'רשימת ההפסקות לא תקינה'
    })
// בדיקות שתלויות בכמה שדות יחד: הסיום אחרי ההתחלה, וההפסקות בתוך שעות העבודה
}).custom((value, helpers) => {
    const start = toMinutes(value.workStartTime);
    const end = toMinutes(value.workEndTime);

    if (start >= end) {
        return helpers.message('שעת הסיום חייבת להיות אחרי שעת ההתחלה');
    }

    for (const b of value.breaks) {
        const breakStart = toMinutes(b.startTime);
        const breakEnd = toMinutes(b.endTime);

        if (breakStart >= breakEnd) {
            return helpers.message('בכל הפסקה, הסיום חייב להיות אחרי ההתחלה');
        }

        if (breakStart < start || breakEnd > end) {
            return helpers.message('ההפסקות חייבות להיות בתוך שעות העבודה');
        }
    }

    return value;
});

// הסכמה של בדיקת שעות תפוסות, מי משתמש בה: הנתיב של בדיקת זמינות
// כאן הנתונים מגיעים בכתובת ולא בגוף הבקשה
export const availabilityQuerySchema = Joi.object({
    doctorId: doctorIdField,
    date: Joi.string().pattern(DATE_PATTERN).required().messages({
        'string.pattern.base': 'התאריך חייב להיות בפורמט שנה-חודש-יום',
        'string.empty': 'נא לבחור תאריך',
        'any.required': 'נא לבחור תאריך'
    })
});
