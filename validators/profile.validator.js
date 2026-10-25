import Joi from 'joi';
import { phone } from './common.validator.js';

export const baseProfile = {
    name: Joi.string().trim().min(2).label('שם'),
    phone: phone.allow(''),
    email: Joi.string().trim().lowercase().email().label('אימייל')   // חדש
};

export const patientProfileSchema = Joi.object({
   ...baseProfile,
    dateBirth: Joi.date().iso().max('now').label('תאריך לידה'),
    medicalNotes: Joi.string().allow('').max(1000).label('הערות רפואיות')
}).min(1); // אי אפשר לשלוח אובייקט ריק


export const doctorProfileSchema =Joi.object({
    ...baseProfile,
    specialty: Joi.string().trim().max(100).allow('').label('התמחות'),
}).min(1)

export const profileSchemas = { patient: patientProfileSchema, doctor: doctorProfileSchema };

