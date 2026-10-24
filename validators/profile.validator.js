export const patientProfileSchema = Joi.object({
    name: Joi.string().trim().min(2),            // בלי .required()
    phone: phone.allow(''),
    dateBirth: Joi.date().iso().max('now'),
    medicalNotes: Joi.string().allow('').max(1000)
}).min(1);                                       // אי אפשר לשלוח אובייקט ריק