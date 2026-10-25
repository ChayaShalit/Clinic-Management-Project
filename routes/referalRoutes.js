import express from 'express'
import { createReferal,getReferalForPatient,markReferalAsRead} from '../controllers/referalControler.js'
import files from '../middlewares/files.middleware.js';
import {auth,authDoctor} from '../middlewares/auth.middleware.js'
import { validate } from '../middlewares/validate.middleware.js'
import { createReferalSchema } from '../validators/referals.valdator.js'

 export const referalRouter=express.Router();
referalRouter.post('/referals',auth,authDoctor, files.single('attachedFile'), createReferal)

referalRouter.post('/referals', auth, authDoctor, files.single('attachedFile'), validate(createReferalSchema), createReferal)

 referalRouter.get('/patients/:id/referals', auth, getReferalForPatient)
referalRouter.put('/referals/:referalId', auth, validate(Joi.object({ referalId: objectId.required() }), 'params'), markReferalAsRead)
