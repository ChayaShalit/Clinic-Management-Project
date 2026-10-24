import Joi from 'joi';
import { DAYS, TIME_PATTERN, toMinutes } from '../utils/time.js';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

// מזהה רופא: חובה, ובפורמט של מזהה Mongo
const doctorIdField = Joi.string().pattern(OBJECT_ID_PATTERN).required().messages({
    'string.pattern.base': 'מזהה הרופא לא תקין',
    'string.empty': 'נא לבחור רופא',
    'any.required': 'נא לבחור רופא'
});

// שדה שעה בפורמט HH:MM
const timeField = (requiredMessage) => Joi.string().pattern(TIME_PATTERN).required().messages({
    'string.pattern.base': 'יש להזין שעה בפורמט תקין (למשל 08:00)',
    'string.empty': requiredMessage,
    'any.required': requiredMessage
});

// קביעת תור חדש. המטופלת נקבעת בשרת לפי ההתחברות, ולכן היא לא נשלחת
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

// עדכון תור קיים. אפשר לשלוח רק חלק מהשדות
export const updateAppointmentSchema = Joi.object({
    date: Joi.string().pattern(DATE_PATTERN).messages({
        'string.pattern.base': 'התאריך חייב להיות בפורמט שנה-חודש-יום',
        'string.empty': 'נא לבחור תאריך'
    }),
    time: Joi.string().pattern(TIME_PATTERN).messages({
        'string.pattern.base': 'יש להזין שעה בפורמט תקין (למשל 08:00)',
        'string.empty': 'נא לבחור שעה'
    }),
    treatmentType: Joi.string().trim().max(50).allow('', null).messages({
        'string.max': 'סוג הטיפול ארוך מדי'
    }),
    status: Joi.string().valid('confirmed', 'cancelled', 'completed').messages({
        'any.only': 'סטטוס התור לא תקין'
    })
}).min(1).messages({
    'object.min': 'לא נשלח שום שדה לעדכון'
});

// שעות העבודה של הרופא
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

// בדיקת זמינות: הרופא והתאריך מגיעים בכתובת (query) ולא בגוף הבקשה
export const availabilityQuerySchema = Joi.object({
    doctorId: doctorIdField,
    date: Joi.string().pattern(DATE_PATTERN).required().messages({
        'string.pattern.base': 'התאריך חייב להיות בפורמט שנה-חודש-יום',
        'string.empty': 'נא לבחור תאריך',
        'any.required': 'נא לבחור תאריך'
    })
});
