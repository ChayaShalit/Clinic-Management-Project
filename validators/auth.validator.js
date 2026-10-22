import { AppError } from '../utils/AppError.js';

export const validate = (schema) => (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
        abortEarly: false,// עוצר אחרי שגיאה אחת true מחזיר מחרוזת ארוכה מכל השגיאות , אם יהיה
        stripUnknown: true// מוחק שדות מיותרים שנשלחו
    });
    if (error) {
        const message = error.details.map(d => d.message).join(', ');
        return next(new AppError(message, 400, 'validation error'));
    }
    req.body = value;
    next();
};