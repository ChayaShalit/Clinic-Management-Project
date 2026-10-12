import express from 'express'
import { createReferal,getReferalForPatient,markReferalAsRead} from '../controllers/referalControler.js'
import files from '../middlewares/files.middleware.js';
import {auth,authDoctor} from '../middlewares/auth.middleware.js'

 export const referalRouter=express.Router();
referalRouter.post('/referals',auth,authDoctor, files.single('attachedFile'), createReferal)

 referalRouter.get('/patients/:id/referals', auth, getReferalForPatient)

 referalRouter.put('/referals/:referalId',auth ,markReferalAsRead)
