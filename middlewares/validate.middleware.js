import { AppError } from '../utils/AppError.js';

const hebrewMessages = {
    'any.required': 'השדה {{#label}} הוא חובה',
    'string.empty': 'השדה {{#label}} לא יכול להיות ריק',
    'string.min': 'השדה {{#label}} חייב להכיל לפחות {{#limit}} תווים',
    'string.max': 'השדה {{#label}} ארוך מדי',
    'string.email': 'כתובת אימייל לא תקינה',
    'string.pattern.base': 'השדה {{#label}} בפורמט לא תקין',
    'any.only': 'ערך לא מותר בשדה {{#label}}',
    'date.base': 'השדה {{#label}} חייב להיות תאריך תקין',
    'date.max': 'התאריך בשדה {{#label}} לא יכול להיות בעתיד',
    'number.base': 'השדה {{#label}} חייב להיות מספר',
    'number.min': 'השדה {{#label}} חייב להיות לפחות {{#limit}}',
    'number.max': 'השדה {{#label}} לא יכול לעלות על {{#limit}}',
    'number.integer': 'השדה {{#label}} חייב להיות מספר שלם',
    'object.min': 'לא נשלח אף שדה לעדכון'
};


// בודק את גוף הבקשה (ברירת מחדל) או את פרמטרי הכתובת (source = 'query') מול סכמת Joi
export const validate = (schema, source = 'body') => (req, res, next) => {
    console.log(`schema: ${schema}`)

    const activeSchema = typeof schema === 'function' ? schema(req) : schema;
    if (!activeSchema) return next(new AppError('אין הרשאה לפעולה זו', 403, 'auth error'));


    const { error, value } = activeSchema.validate(req[source], {
        abortEarly: false,// false אוסף את כל השגיאות ולא עוצר בראשונה
        stripUnknown: true,// מוחק שדות מיותרים שנשלחו
        messages: hebrewMessages,
        errors: { wrap: { label: false } }
    });
    
    if (error) {
        return next(new AppError(error.details.map(d => d.message).join(', '), 400, 'validation error'));
    }
       
    // ב-Express 5 אי אפשר לדרוס את req.query, לכן מחליפים רק את גוף הבקשה
    if (source === 'body') req.body = value;
    next();
};
