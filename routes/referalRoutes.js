import express from 'express'
import { createReferal,getReferalForPatient,markReferalAsRead

 } from '../controllers/referalControler.js'
 import files from '../middlewares/files.middleware.js';
 Router.post('/referals',files.single('attachedFile'),createReferal)
 export const referalRouter=express.Router();
 referalRouter.get('/patients/:id/referals',getReferalForPatient)
 referalRouter.post('/referals',createReferal)
 referalRouter.put('/referals/:referalId',markReferalAsRead)
 export default referalRouter;