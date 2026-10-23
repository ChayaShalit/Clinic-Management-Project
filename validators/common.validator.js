import Joi from "joi";

export const objectId = Joi.string().hex().length(24).label('מזהה');

export const timeHHMM = Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/).label('שעה');

export const weekDay = Joi.string().valid(
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
).label('יום');

export const phone = Joi.string().pattern(/^0\d{1,2}-?\d{7}$/).label('טלפון');