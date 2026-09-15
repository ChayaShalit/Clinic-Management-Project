import express from 'express'
import { createReferal,getReferalForPatient,markReferalAsRead

 } from '../controllers/referalControler.js'
 import files from '../middlewares/files.middleware.js';

 export const referalRouter=express.Router();
referalRouter.post('/referals', files.single('attachedFile'), createReferal)
 referalRouter.get('/patients/:id/referals',getReferalForPatient)

 referalRouter.put('/referals/:referalId',markReferalAsRead)
