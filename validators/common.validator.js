import Joi from "joi";

export const objectId = Joi.string().pattern(/^[0-9a-fA-F]{24}$/).label('מזהה').messages({
    'string.pattern.base': 'המזהה לא תקין',
    'string.empty': 'המזהה חסר',
    'any.required': 'המזהה חסר'
});

export const timeHHMM = Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/).label('שעה');

export const weekDay = Joi.string().valid(
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
).label('יום');

export const phone = Joi.string().pattern(/^0\d{1,2}-?\d{7}$/).label('טלפון');