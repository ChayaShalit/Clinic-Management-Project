import Joi from 'joi';

export const registerSchema = Joi.object({
    tz: Joi.string().pattern(/^\d{9}$/).required().messages({
        'string.pattern.base': 'ת.ז חייבת להכיל 9 ספרות',
        'any.required': 'נא להזין מספר זהות',
        'string.empty': 'נא להזין מספר זהות'
    }),
    name: Joi.string().trim().min(2).required().messages({
        'string.min': 'השם חייב להכיל לפחות 2 תווים',
        'any.required': 'נא להזין שם מלא',
        'string.empty': 'נא להזין שם מלא'
    }),
    email: Joi.string().email().required().messages({
        'string.email': 'כתובת אימייל לא תקינה',
        'any.required': 'נא להזין כתובת אימייל',
        'string.empty': 'נא להזין כתובת אימייל'
    }),
    password: Joi.string().min(6).required().messages({
        'string.min': 'סיסמה חייבת להכיל לפחות 6 תווים',
        'any.required': 'נא להזין סיסמה',
        'string.empty': 'נא להזין סיסמה'
    }),
    role: Joi.string().valid('patient', 'doctor').required().messages({
        'any.only': 'התפקיד חייב להיות מטופל או רופא',
        'any.required': 'נא לבחור תפקיד'
    })
});

export const loginSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'כתובת אימייל לא תקינה',
        'any.required': 'נא להזין כתובת אימייל'
    }),
    password: Joi.string().required().messages({
        'any.required': 'נא להזין סיסמה'
    })
});