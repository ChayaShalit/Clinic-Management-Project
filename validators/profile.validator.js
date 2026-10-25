import Joi from 'joi';
import { phone } from './common.validator.js';
export const patientProfileSchema = Joi.object({
    name: Joi.string().trim().min(2),            // בלי .required()
    phone: phone.allow(''),
    dateBirth: Joi.date().iso().max('now'),
    medicalNotes: Joi.string().allow('').max(1000)
}).min(1); // אי אפשר לשלוח אובייקט ריק

export const baseProfile = {
    name: Joi.string().trim().min(2).label('שם'),
    phone: phone.allow(''),
    email: Joi.string().trim().lowercase().email().label('אימייל')   // חדש
};