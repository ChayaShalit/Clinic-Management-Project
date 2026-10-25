import Joi from 'joi';

export const createReferalSchema = Joi.object({
    patientTz: Joi.string().pattern(/^\d{9}$/).required().messages({
        'string.pattern.base': 'ת.ז חייבת להכיל 9 ספרות',
        'string.empty': 'נא להזין תעודת זהות של המטופל/ת',
        'any.required': 'נא להזין תעודת זהות של המטופל/ת'
    }),
    kindReferal: Joi.string().valid('בדיקת דם', 'הפניה לרופא מומחה', 'מרשם', 'אחר').required().messages({
        'any.only': 'סוג ההפניה לא תקין',
        'any.required': 'נא לבחור סוג הפניה'
    }),
    description: Joi.string().trim().min(5).max(600).required().messages({
        'string.min': 'התיאור חייב להכיל לפחות 5 תווים',
        'string.max': 'התיאור ארוך מדי',
        'string.empty': 'נא להזין תיאור',
        'any.required': 'נא להזין תיאור'
    })
});