import { AppError } from '../utils/AppError.js';

// בודק את גוף הבקשה (ברירת מחדל) או את פרמטרי הכתובת (source = 'query') מול סכמת Joi
export const validate = (schema, source = 'body') => (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
        abortEarly: false,// false אוסף את כל השגיאות ולא עוצר בראשונה
        stripUnknown: true// מוחק שדות מיותרים שנשלחו
    });
    if (error) {
        const message = error.details.map(d => d.message).join(', ');

        return next(new AppError(message, 400, 'validation error'));
    }
    // ב-Express 5 אי אפשר לדרוס את req.query, לכן מחליפים רק את גוף הבקשה
    if (source === 'body') req.body = value;
    next();
};
